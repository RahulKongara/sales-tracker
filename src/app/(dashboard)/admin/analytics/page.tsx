"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, toISTDateString } from "@/lib/utils";
import { PAYMENT_MODE_CONFIG } from "@/lib/constants";
import type { PaymentMode } from "@/lib/constants";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface Summary {
    totalRevenue: number;
    totalPrescriptionRevenue: number;
    totalMedicinesRevenue: number;
    billCount: number;
    avgBillValue: number;
}

interface DailyDataPoint {
    date: string;
    revenue: number;
    count: number;
}

interface EmployeeStat {
    name: string;
    username: string;
    count: number;
    total: number;
}

interface TopMedicine {
    name: string;
    totalQuantity: number;
}

interface AnalyticsData {
    dateRange: { from: string; to: string };
    summary: Summary;
    byPaymentMode: Record<string, { count: number; total: number }>;
    dailyData: DailyDataPoint[];
    byEmployee: EmployeeStat[];
    topMedicines: TopMedicine[];
}

/* ────────────────────────────────────────────────────────────── */
/*  Mini Bar Chart (pure CSS)                                    */
/* ────────────────────────────────────────────────────────────── */

function BarChart({ data }: { data: DailyDataPoint[] }) {
    if (data.length === 0) {
        return (
            <div className="p-8 text-center text-fg-muted text-[0.8125rem]">
                No data for this period.
            </div>
        );
    }

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

    return (
        <div className="flex items-end gap-1 h-[180px] px-2">
            {data.map((d) => {
                const height = (d.revenue / maxRevenue) * 150;
                const dateObj = new Date(d.date + "T12:00:00+05:30");
                const dayLabel = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                });
                return (
                    <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1"
                    >
                        <span className="text-[0.625rem] text-fg-muted whitespace-nowrap">
                            {formatCurrency(d.revenue)}
                        </span>
                        <div
                            className="w-full max-w-[40px] rounded-t-[4px] transition-[height] duration-300
                                       bg-gradient-to-b from-blue-500 to-[var(--blue-400,#60a5fa)]"
                            style={{ height: `${Math.max(height, 4)}px` }}
                            title={`${dayLabel}: ${formatCurrency(d.revenue)} (${d.count} bills)`}
                        />
                        <span className="text-[0.625rem] text-fg-muted whitespace-nowrap">
                            {dayLabel}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Shared classes                                               */
/* ────────────────────────────────────────────────────────────── */

const CARD = "bg-surface border border-border rounded-lg shadow-sm";
const INPUT_CLS =
    "px-2 py-1.5 text-[0.8125rem] border border-border rounded-lg bg-surface text-fg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";
const BTN_SECONDARY =
    "px-2 py-1 text-[0.6875rem] font-medium text-fg-secondary bg-surface-secondary border border-border rounded-lg cursor-pointer hover:bg-surface-tertiary hover:text-fg transition-colors duration-150";

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Date range — default last 7 days
    const today = toISTDateString();
    const weekAgo = toISTDateString(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

    const [fromDate, setFromDate] = useState(weekAgo);
    const [toDate, setToDate] = useState(today);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `/api/admin/analytics?from=${fromDate}&to=${toDate}`
            );
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            if (!res.ok) throw new Error("Failed to load analytics");
            const d = await res.json();
            setData(d);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, router]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Quick presets
    function setPreset(days: number) {
        const end = toISTDateString();
        const start = toISTDateString(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
        setFromDate(start);
        setToDate(end);
    }

    const paymentModes: PaymentMode[] = ["CASH", "CARD", "PAYTM"];

    return (
        <div className="min-h-screen bg-surface-secondary">

            <div className="max-w-[1100px] mx-auto p-6">
                {/* ── Date Range Picker ────────────────────────────────── */}
                <div className={`${CARD} px-5 py-4 mb-6 flex items-center gap-4 flex-wrap`}>
                    <div className="flex items-center gap-2">
                        <label className="text-[0.8125rem] font-medium text-fg-secondary">
                            From
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className={INPUT_CLS}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[0.8125rem] font-medium text-fg-secondary">
                            To
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className={INPUT_CLS}
                        />
                    </div>
                    <div className="flex gap-1.5 border-l border-border pl-3">
                        {[
                            { label: "Today", days: 1 },
                            { label: "7 Days", days: 7 },
                            { label: "30 Days", days: 30 },
                            { label: "90 Days", days: 90 },
                        ].map((p) => (
                            <button
                                key={p.days}
                                onClick={() => setPreset(p.days)}
                                className={BTN_SECONDARY}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="border-l border-border pl-3">
                        <button
                            onClick={() => {
                                window.open(
                                    `/api/admin/export/csv?from=${fromDate}&to=${toDate}`,
                                    "_blank"
                                );
                            }}
                            className={`${BTN_SECONDARY} text-green-600`}
                        >
                            📥 CSV
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-fg-muted text-sm">
                        Loading analytics...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-600 text-sm">
                        {error}
                    </div>
                ) : data ? (
                    <>
                        {/* ── Summary Cards ──────────────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                {
                                    label: "Total Revenue",
                                    value: formatCurrency(data.summary.totalRevenue),
                                    sub: `${data.summary.billCount} bills`,
                                    color: "text-fg",
                                },
                                {
                                    label: "Medicines Revenue",
                                    value: formatCurrency(data.summary.totalMedicinesRevenue),
                                    sub: `${((data.summary.totalMedicinesRevenue / Math.max(data.summary.totalRevenue, 1)) * 100).toFixed(0)}% of total`,
                                    color: "text-blue-600",
                                },
                                {
                                    label: "Prescription Revenue",
                                    value: formatCurrency(data.summary.totalPrescriptionRevenue),
                                    sub: `${((data.summary.totalPrescriptionRevenue / Math.max(data.summary.totalRevenue, 1)) * 100).toFixed(0)}% of total`,
                                    color: "text-green-600",
                                },
                                {
                                    label: "Avg Bill Value",
                                    value: formatCurrency(data.summary.avgBillValue),
                                    sub: "per bill",
                                    color: "text-fg",
                                },
                            ].map((c) => (
                                <div key={c.label} className={`${CARD} p-5`}>
                                    <p className="text-xs font-medium text-fg-muted mb-1 uppercase tracking-wider">
                                        {c.label}
                                    </p>
                                    <p className={`text-2xl font-bold tracking-tight tabular-nums ${c.color}`}>
                                        {c.value}
                                    </p>
                                    <p className="text-xs text-fg-muted mt-1">
                                        {c.sub}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Revenue Trend + Payment Breakdown ──────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
                            {/* Daily Revenue Chart */}
                            <div className={`${CARD} p-5`}>
                                <h2 className="text-sm font-semibold text-fg mb-4">
                                    Daily Revenue
                                </h2>
                                <BarChart data={data.dailyData} />
                            </div>

                            {/* Payment Breakdown */}
                            <div className={`${CARD} p-5`}>
                                <h2 className="text-sm font-semibold text-fg mb-4">
                                    Payment Breakdown
                                </h2>
                                <div className="flex flex-col gap-3">
                                    {paymentModes.map((mode) => {
                                        const config = PAYMENT_MODE_CONFIG[mode];
                                        const modeData = data.byPaymentMode[mode];
                                        const total = modeData?.total || 0;
                                        const count = modeData?.count || 0;
                                        const pct =
                                            data.summary.totalRevenue > 0
                                                ? (total / data.summary.totalRevenue) * 100
                                                : 0;
                                        return (
                                            <div key={mode}>
                                                <div className="flex justify-between mb-1">
                                                    <span
                                                        className="text-[0.8125rem] font-medium"
                                                        style={{ color: config.color }}
                                                    >
                                                        {config.label}
                                                    </span>
                                                    <span className="text-[0.8125rem] font-semibold text-fg tabular-nums">
                                                        {formatCurrency(total)}
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="h-2 bg-surface-secondary rounded overflow-hidden">
                                                    <div
                                                        className="h-full rounded transition-[width] duration-300"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: config.color,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[0.6875rem] text-fg-muted">
                                                    {count} bill{count !== 1 ? "s" : ""} · {pct.toFixed(0)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Top Medicines + Employee Stats ─────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Top Medicines */}
                            <div className={`${CARD} p-5`}>
                                <h2 className="text-sm font-semibold text-fg mb-4">
                                    Top Medicines
                                </h2>
                                {data.topMedicines.length === 0 ? (
                                    <p className="text-[0.8125rem] text-fg-muted">
                                        No data.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {data.topMedicines.map((med, i) => (
                                            <div
                                                key={med.name}
                                                className={`flex justify-between items-center py-2
                                                    ${i < data.topMedicines.length - 1 ? "border-b border-border" : ""}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[0.6875rem] font-semibold text-fg-muted w-5">
                                                        {i + 1}.
                                                    </span>
                                                    <span className="text-[0.8125rem] text-fg capitalize">
                                                        {med.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    {med.totalQuantity} units
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Employee Performance */}
                            <div className={`${CARD} p-5`}>
                                <h2 className="text-sm font-semibold text-fg mb-4">
                                    Employee Performance
                                </h2>
                                {data.byEmployee.length === 0 ? (
                                    <p className="text-[0.8125rem] text-fg-muted">
                                        No data.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {data.byEmployee.map((emp) => {
                                            const pct =
                                                data.summary.totalRevenue > 0
                                                    ? (emp.total / data.summary.totalRevenue) * 100
                                                    : 0;
                                            return (
                                                <div key={emp.username}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-[0.8125rem] font-medium text-fg">
                                                            {emp.name}
                                                        </span>
                                                        <span className="text-[0.8125rem] font-semibold text-fg tabular-nums">
                                                            {formatCurrency(emp.total)}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-surface-secondary rounded overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded transition-[width] duration-300"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[0.6875rem] text-fg-muted">
                                                        {emp.count} bill{emp.count !== 1 ? "s" : ""} ·{" "}
                                                        {pct.toFixed(0)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
