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
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

// Helper: today's date in IST as YYYY-MM-DD
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
            <div className="max-w-[1100px] mx-auto p-6">

                {/* ── Date Picker Row ──────────────────────────────── */}
                <div className="flex items-center gap-3 mb-4">
                    <label className="text-[0.8125rem] font-semibold text-fg-secondary">
                        📅 View date:
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        max={todayIST()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 text-[0.8125rem] font-mono text-fg-secondary bg-surface-secondary
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
                            ← Back to Today
                        </button>
                    )}
                    {isToday && (
                        <span className="text-[0.6875rem] text-fg-muted">
                            Auto-refreshes every 30s
                        </span>
                    )}
                </div>

                {/* ── Stats Cards Row ─────────────────────────────────── */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
                    {/* Total Revenue */}
                    <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
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
                            <div key={mode} className="bg-surface border border-border rounded-lg shadow-sm p-5">
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
                    <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
                        <p className="text-xs font-medium text-fg-muted mb-1 uppercase tracking-wider">
                            Prescriptions
                        </p>
                        <p className="text-2xl font-bold text-blue-600 tracking-tight tabular-nums">
                            {stats?.prescriptionCount || 0} Rx
                        </p>
                        <p className="text-xs text-fg-muted mt-1">
                            {stats?.nonPrescriptionCount || 0} OTC · {formatCurrency(stats?.totalPrescriptionCharges || 0)} charges
                        </p>
                    </div>
                </div>

                {/* ── Payment Stream Proportion Bar ────────────────── */}
                {(stats?.totalRevenue || 0) > 0 && (
                    <div className="bg-surface border border-border rounded-lg shadow-sm px-5 py-4 mb-6">
                        <p className="text-xs font-semibold text-fg-secondary mb-2 uppercase tracking-wider">
                            Payment Stream
                        </p>
                        <div className="flex rounded-lg overflow-hidden h-7">
                            {paymentModes.map((mode) => {
                                const amount = stats?.byPaymentMode[mode] || 0;
                                const pct = stats?.totalRevenue
                                    ? (amount / stats.totalRevenue) * 100
                                    : 0;
                                if (pct === 0) return null;
                                const config = PAYMENT_MODE_CONFIG[mode];
                                return (
                                    <div
                                        key={mode}
                                        title={`${config.label}: ${formatCurrency(amount)} (${pct.toFixed(1)}%)`}
                                        className="flex items-center justify-center text-white text-[0.6875rem] font-semibold overflow-hidden transition-[width] duration-300"
                                        style={{
                                            width: `${pct}%`,
                                            background: config.color,
                                            minWidth: pct > 8 ? "auto" : "0",
                                        }}
                                    >
                                        {pct > 12 ? `${config.label} ${pct.toFixed(0)}%` : ""}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-2 flex-wrap">
                            {paymentModes.map((mode) => {
                                const amount = stats?.byPaymentMode[mode] || 0;
                                const config = PAYMENT_MODE_CONFIG[mode];
                                return (
                                    <span
                                        key={mode}
                                        className="text-xs text-fg-secondary flex items-center gap-1.5"
                                    >
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-sm"
                                            style={{ background: config.color }}
                                        />
                                        {config.label}: {formatCurrency(amount)}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Bills Table ────────────────────────────────────── */}
                <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
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
                            ↻ Refresh
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
                                                    {bill.hasPrescription ? "📋" : "—"}
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
                                                            className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50
                                                                       border border-blue-500 rounded-lg no-underline
                                                                       hover:bg-blue-100 transition-colors duration-150"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(bill.id, bill.billNumber)
                                                            }
                                                            disabled={deletingId === bill.id}
                                                            className={`px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50
                                                                       border border-red-500 rounded-lg cursor-pointer
                                                                       hover:bg-red-100 transition-colors duration-150
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
