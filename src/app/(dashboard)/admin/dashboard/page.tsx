"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatISTTime, toISTDateString } from "@/lib/utils";
import { PAYMENT_MODE_CONFIG } from "@/lib/constants";
import type { PaymentMode } from "@/lib/constants";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface DashboardBill {
    id: string;
    billNumber: string;
    createdAt: string;
    customerName: string | null;
    paymentMode: string;
    hasPrescription: boolean;
    grandTotal: number;
    itemCount: number;
    createdByName: string;
    createdByUser: string;
}

interface DashboardStats {
    totalRevenue: number;
    billCount: number;
    byPaymentMode: Record<string, number>;
    billCountByMode: Record<string, number>;
    prescriptionCount: number;
    nonPrescriptionCount: number;
    totalPrescriptionCharges: number;
    date: string;
    bills: DashboardBill[];
}

/* ────────────────────────────────────────────────────────────── */
/*  Payment Stream Pie Chart                                     */
/* ────────────────────────────────────────────────────────────── */

interface PieSlice {
    label: string;
    value: number;
    color: string;
}

function PaymentPieChart({ slices }: { slices: PieSlice[] }) {
    const total = slices.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;

    const size = 180;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 80;
    const innerR = 50; // donut hole

    let cumAngle = -Math.PI / 2; // start at 12 o'clock

    function arcPath(startAngle: number, endAngle: number, r: number, ir: number) {
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + ir * Math.cos(endAngle);
        const iy1 = cy + ir * Math.sin(endAngle);
        const ix2 = cx + ir * Math.cos(startAngle);
        const iy2 = cy + ir * Math.sin(startAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

        return [
            `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
            `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
            `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
            "Z",
        ].join(" ");
    }

    const paths = slices
        .filter((s) => s.value > 0)
        .map((slice) => {
            const angle = (slice.value / total) * Math.PI * 2;
            const startAngle = cumAngle;
            const endAngle = cumAngle + angle;
            cumAngle = endAngle;
            return { ...slice, d: arcPath(startAngle, endAngle, outerR, innerR) };
        });

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-45 mx-auto">
            {paths.map((p) => (
                <path
                    key={p.label}
                    d={p.d}
                    fill={p.color}
                    className="transition-opacity duration-150 hover:opacity-80"
                >
                    <title>{p.label}: {((p.value / total) * 100).toFixed(1)}%</title>
                </path>
            ))}
        </svg>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

function todayIST() {
    return toISTDateString();
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(todayIST());

    const isToday = selectedDate === todayIST();
    const dateLabel = isToday ? "Today" : selectedDate;

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/stats?date=${selectedDate}`);
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            if (!res.ok) throw new Error("Failed to load stats");
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [router, selectedDate]);

    useEffect(() => {
        setLoading(true);
        fetchStats();
    }, [fetchStats]);

    // 30-second auto-refresh (only for today)
    useEffect(() => {
        if (!isToday) return;
        const iv = setInterval(fetchStats, 30_000);
        return () => clearInterval(iv);
    }, [isToday, fetchStats]);

    async function handleDelete(billId: string, billNumber: string) {
        if (!confirm(`Delete bill ${billNumber}? This cannot be undone.`)) return;
        setDeletingId(billId);
        try {
            const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            fetchStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Delete failed");
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-secondary flex items-center justify-center text-fg-muted text-sm">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface-secondary flex items-center justify-center text-red-600 text-sm">
                {error}
            </div>
        );
    }

    const paymentModes: PaymentMode[] = ["CASH", "CARD", "PAYTM"];

    return (
        <div className="min-h-screen bg-surface-secondary">

            {/* ── Content ─────────────────────────────────────────── */}
            <div className="max-w-275 mx-auto p-6">

                {/* ── Liquid Glass Header + Date Picker ─────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-fg tracking-tight">
                            Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[0.8125rem] font-medium text-fg-secondary hidden sm:inline">
                            View date:
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            max={todayIST()}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 text-[0.8125rem] font-mono text-fg-secondary bg-surface
                                       border border-border rounded-lg cursor-pointer
                                       outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                        />
                        {!isToday && (
                            <button
                                onClick={() => setSelectedDate(todayIST())}
                                className="px-3 py-1.5 text-xs font-medium text-fg-secondary bg-surface-secondary
                                           border border-border rounded-lg cursor-pointer
                                           hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                            >
                                Back to Today
                            </button>
                        )}
                        {isToday && (
                            <span className="text-[0.6875rem] text-fg-muted hidden sm:inline">
                                Auto-refreshes every 30s
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Stats Cards Row ─────────────────────────────────── */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
                    {/* Total Revenue */}
                    <div className="glass-card-primary p-5">
                        <p className="text-xs font-medium text-fg-muted mb-1 uppercase tracking-wider">
                            {dateLabel}&apos;s Revenue
                        </p>
                        <p className="text-[1.75rem] font-bold text-fg tracking-tight tabular-nums">
                            {formatCurrency(stats?.totalRevenue || 0)}
                        </p>
                        <p className="text-xs text-fg-muted mt-1">
                            {stats?.billCount || 0} bills
                        </p>
                    </div>

                    {/* Payment Mode Breakdown */}
                    {paymentModes.map((mode) => {
                        const config = PAYMENT_MODE_CONFIG[mode];
                        const amount = stats?.byPaymentMode[mode] || 0;
                        const count = stats?.billCountByMode[mode] || 0;
                        return (
                            <div key={mode} className="glass-card p-5">
                                <p className="text-xs font-medium text-fg-muted mb-1 uppercase tracking-wider">
                                    {config.label}
                                </p>
                                <p
                                    className="text-2xl font-bold tracking-tight tabular-nums"
                                    style={{ color: config.color }}
                                >
                                    {formatCurrency(amount)}
                                </p>
                                <p className="text-xs text-fg-muted mt-1">
                                    {count} bill{count !== 1 ? "s" : ""}
                                </p>
                            </div>
                        );
                    })}
                    {/* Prescription Summary */}
                    <div className="glass-card p-5">
                        <p className="text-xs font-medium text-fg-muted mb-1 uppercase tracking-wider">
                            Prescriptions
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight tabular-nums">
                            {formatCurrency(stats?.totalPrescriptionCharges || 0)}
                        </p>
                        <p className="text-xs text-fg-muted mt-1">
                            {stats?.prescriptionCount || 0} Rx · {stats?.nonPrescriptionCount || 0} OTC
                        </p>
                    </div>
                </div>

                {/* ── Payment Stream Pie Chart ────────────────────────── */}
                {(stats?.totalRevenue || 0) > 0 && (
                    <div className="glass-card px-5 py-4 mb-6">
                        <p className="text-xs font-semibold text-fg-secondary mb-3 uppercase tracking-wider">
                            Payment Stream
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <PaymentPieChart
                                slices={paymentModes.map((mode) => ({
                                    label: PAYMENT_MODE_CONFIG[mode].label,
                                    value: stats?.byPaymentMode[mode] || 0,
                                    color: PAYMENT_MODE_CONFIG[mode].color,
                                }))}
                            />
                            <div className="flex flex-col gap-2">
                                {paymentModes.map((mode) => {
                                    const config = PAYMENT_MODE_CONFIG[mode];
                                    const amount = stats?.byPaymentMode[mode] || 0;
                                    const pct = stats?.totalRevenue
                                        ? ((amount / stats.totalRevenue) * 100).toFixed(1)
                                        : "0";
                                    return (
                                        <div key={mode} className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                                                style={{ background: config.color }}
                                            />
                                            <span className="text-xs text-fg-secondary">
                                                {config.label}
                                            </span>
                                            <span className="text-xs font-semibold text-fg tabular-nums ml-auto">
                                                {formatCurrency(amount)}
                                            </span>
                                            <span className="text-xs text-fg-muted tabular-nums w-10 text-right">
                                                {pct}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Bills Table ────────────────────────────────────── */}
                <div className="glass-table">
                    <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-fg">
                            {dateLabel}&apos;s Bills ({stats?.bills.length || 0})
                        </h2>
                        <button
                            onClick={fetchStats}
                            className="px-2 py-1 text-[0.6875rem] font-medium text-fg-secondary bg-surface-secondary
                                       border border-border rounded-lg cursor-pointer
                                       hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                        >
                            Refresh
                        </button>
                    </div>

                    {!stats?.bills.length ? (
                        <div className="p-12 text-center text-fg-muted text-sm">
                            No bills for this date.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[0.8125rem]">
                                <thead>
                                    <tr className="border-b border-border">
                                        {[
                                            "Bill #",
                                            "Time",
                                            "Customer",
                                            "Items",
                                            "Payment",
                                            "Rx",
                                            "Total",
                                            "By",
                                            "Actions",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="px-3 py-2.5 text-left font-semibold text-fg-secondary text-xs
                                                           uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.bills.map((bill) => {
                                        const modeConfig =
                                            PAYMENT_MODE_CONFIG[bill.paymentMode as PaymentMode];
                                        return (
                                            <tr
                                                key={bill.id}
                                                className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors duration-100"
                                            >
                                                <td className="px-3 py-2.5 font-mono font-semibold text-fg whitespace-nowrap">
                                                    {bill.billNumber}
                                                </td>
                                                <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">
                                                    {formatISTTime(new Date(bill.createdAt))}
                                                </td>
                                                <td className="px-3 py-2.5 text-fg">
                                                    {bill.customerName || (
                                                        <span className="text-fg-muted">Walk-in</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-fg-secondary tabular-nums">
                                                    {bill.itemCount}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span
                                                        className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold"
                                                        style={{
                                                            background: modeConfig?.lightBg || "#f3f4f6",
                                                            color: modeConfig?.color || "#374151",
                                                        }}
                                                    >
                                                        {modeConfig?.label || bill.paymentMode}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-fg-secondary">
                                                    {bill.hasPrescription ? "Rx" : "\u2014"}
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold text-fg whitespace-nowrap tabular-nums">
                                                    {formatCurrency(bill.grandTotal)}
                                                </td>
                                                <td className="px-3 py-2.5 text-fg-muted text-xs">
                                                    {bill.createdByUser}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex gap-1.5">
                                                        <Link
                                                            href={`/bills/${bill.id}/edit`}
                                                            className="px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400
                                                                       bg-blue-50 dark:bg-blue-500/10
                                                                       border border-blue-500/30 rounded-lg no-underline
                                                                       hover:bg-blue-100 dark:hover:bg-blue-500/20
                                                                       transition-colors duration-150"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(bill.id, bill.billNumber)
                                                            }
                                                            disabled={deletingId === bill.id}
                                                            className={`px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400
                                                                       bg-red-50 dark:bg-red-500/10
                                                                       border border-red-500/30 rounded-lg cursor-pointer
                                                                       hover:bg-red-100 dark:hover:bg-red-500/20
                                                                       transition-colors duration-150
                                                                       ${deletingId === bill.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            {deletingId === bill.id ? "..." : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
