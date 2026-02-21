"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
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
/*  Styles                                                       */
/* ────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
};

const btnSecondary: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
};

const input: React.CSSProperties = {
    padding: "0.4rem 0.5rem",
    fontSize: "0.8125rem",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
};

/* ────────────────────────────────────────────────────────────── */
/*  Mini Bar Chart (pure CSS)                                    */
/* ────────────────────────────────────────────────────────────── */

function BarChart({ data }: { data: DailyDataPoint[] }) {
    if (data.length === 0) {
        return (
            <div
                style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.8125rem",
                }}
            >
                No data for this period.
            </div>
        );
    }

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "4px",
                height: "180px",
                padding: "0 0.5rem",
            }}
        >
            {data.map((d) => {
                const height = (d.revenue / maxRevenue) * 150;
                const dateObj = new Date(d.date + "T12:00:00");
                const dayLabel = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                });
                return (
                    <div
                        key={d.date}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.625rem",
                                color: "var(--text-muted)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {formatCurrency(d.revenue)}
                        </span>
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "40px",
                                height: `${Math.max(height, 4)}px`,
                                background:
                                    "linear-gradient(180deg, var(--blue-500), var(--blue-400, #60a5fa))",
                                borderRadius: "4px 4px 0 0",
                                transition: "height 0.3s ease",
                            }}
                            title={`${dayLabel}: ${formatCurrency(d.revenue)} (${d.count} bills)`}
                        />
                        <span
                            style={{
                                fontSize: "0.625rem",
                                color: "var(--text-muted)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {dayLabel}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Date range — default last 7 days
    const today = new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

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
        const end = new Date()
            .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
            .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        setFromDate(start);
        setToDate(end);
    }

    const paymentModes: PaymentMode[] = ["CASH", "CARD", "PAYTM"];

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <header
                style={{
                    background: "var(--bg-primary)",
                    borderBottom: "1px solid var(--border-default)",
                    padding: "0.75rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>📈</span>
                    <h1
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Analytics
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        ← Dashboard
                    </button>
                    <button
                        onClick={() => router.push("/admin/users")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        👥 Users
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
                {/* ── Date Range Picker ────────────────────────────────── */}
                <div
                    style={{
                        ...card,
                        padding: "1rem 1.25rem",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <label
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--text-secondary)",
                            }}
                        >
                            From
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={input}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <label
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--text-secondary)",
                            }}
                        >
                            To
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={input}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.375rem",
                            borderLeft: "1px solid var(--border-default)",
                            paddingLeft: "0.75rem",
                        }}
                    >
                        {[
                            { label: "Today", days: 1 },
                            { label: "7 Days", days: 7 },
                            { label: "30 Days", days: 30 },
                            { label: "90 Days", days: 90 },
                        ].map((p) => (
                            <button
                                key={p.days}
                                onClick={() => setPreset(p.days)}
                                style={{
                                    ...btnSecondary,
                                    fontSize: "0.6875rem",
                                    padding: "0.25rem 0.5rem",
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            borderLeft: "1px solid var(--border-default)",
                            paddingLeft: "0.75rem",
                        }}
                    >
                        <button
                            onClick={() => {
                                window.open(
                                    `/api/admin/export/csv?from=${fromDate}&to=${toDate}`,
                                    "_blank"
                                );
                            }}
                            style={{
                                ...btnSecondary,
                                fontSize: "0.6875rem",
                                padding: "0.25rem 0.5rem",
                                color: "var(--green-600)",
                            }}
                        >
                            📥 CSV
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div
                        style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.875rem",
                        }}
                    >
                        Loading analytics...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--red-600)",
                            fontSize: "0.875rem",
                        }}
                    >
                        {error}
                    </div>
                ) : data ? (
                    <>
                        {/* ── Summary Cards ──────────────────────────────────── */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "1rem",
                                marginBottom: "1.5rem",
                            }}
                        >
                            {[
                                {
                                    label: "Total Revenue",
                                    value: formatCurrency(data.summary.totalRevenue),
                                    sub: `${data.summary.billCount} bills`,
                                    color: "var(--text-primary)",
                                },
                                {
                                    label: "Medicines Revenue",
                                    value: formatCurrency(data.summary.totalMedicinesRevenue),
                                    sub: `${((data.summary.totalMedicinesRevenue / Math.max(data.summary.totalRevenue, 1)) * 100).toFixed(0)}% of total`,
                                    color: "var(--blue-600)",
                                },
                                {
                                    label: "Prescription Revenue",
                                    value: formatCurrency(data.summary.totalPrescriptionRevenue),
                                    sub: `${((data.summary.totalPrescriptionRevenue / Math.max(data.summary.totalRevenue, 1)) * 100).toFixed(0)}% of total`,
                                    color: "var(--green-600)",
                                },
                                {
                                    label: "Avg Bill Value",
                                    value: formatCurrency(data.summary.avgBillValue),
                                    sub: "per bill",
                                    color: "var(--text-primary)",
                                },
                            ].map((c) => (
                                <div key={c.label} style={{ ...card, padding: "1.25rem" }}>
                                    <p
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            color: "var(--text-muted)",
                                            marginBottom: "0.25rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        {c.label}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "1.5rem",
                                            fontWeight: 700,
                                            color: c.color,
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {c.value}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "var(--text-muted)",
                                            marginTop: "0.25rem",
                                        }}
                                    >
                                        {c.sub}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Revenue Trend + Payment Breakdown ──────────────── */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr",
                                gap: "1rem",
                                marginBottom: "1.5rem",
                            }}
                        >
                            {/* Daily Revenue Chart */}
                            <div style={{ ...card, padding: "1.25rem" }}>
                                <h2
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    Daily Revenue
                                </h2>
                                <BarChart data={data.dailyData} />
                            </div>

                            {/* Payment Breakdown */}
                            <div style={{ ...card, padding: "1.25rem" }}>
                                <h2
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    Payment Breakdown
                                </h2>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
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
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        marginBottom: "0.25rem",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "0.8125rem",
                                                            fontWeight: 500,
                                                            color: config.color,
                                                        }}
                                                    >
                                                        {config.label}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "0.8125rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-primary)",
                                                        }}
                                                    >
                                                        {formatCurrency(total)}
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div
                                                    style={{
                                                        height: "8px",
                                                        background: "var(--bg-secondary)",
                                                        borderRadius: "4px",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: "100%",
                                                            background: config.color,
                                                            borderRadius: "4px",
                                                            transition: "width 0.3s ease",
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: "0.6875rem",
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    {count} bill{count !== 1 ? "s" : ""} · {pct.toFixed(0)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Top Medicines + Employee Stats ─────────────────── */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "1rem",
                            }}
                        >
                            {/* Top Medicines */}
                            <div style={{ ...card, padding: "1.25rem" }}>
                                <h2
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    Top Medicines
                                </h2>
                                {data.topMedicines.length === 0 ? (
                                    <p
                                        style={{
                                            fontSize: "0.8125rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No data.
                                    </p>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        {data.topMedicines.map((med, i) => (
                                            <div
                                                key={med.name}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    padding: "0.5rem 0",
                                                    borderBottom:
                                                        i < data.topMedicines.length - 1
                                                            ? "1px solid var(--border-light)"
                                                            : "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "0.6875rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-muted)",
                                                            width: "1.25rem",
                                                        }}
                                                    >
                                                        {i + 1}.
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "0.8125rem",
                                                            color: "var(--text-primary)",
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {med.name}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: "var(--blue-600)",
                                                        background: "var(--blue-50)",
                                                        padding: "0.125rem 0.5rem",
                                                        borderRadius: "var(--radius-sm)",
                                                    }}
                                                >
                                                    {med.totalQuantity} units
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Employee Performance */}
                            <div style={{ ...card, padding: "1.25rem" }}>
                                <h2
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    Employee Performance
                                </h2>
                                {data.byEmployee.length === 0 ? (
                                    <p
                                        style={{
                                            fontSize: "0.8125rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No data.
                                    </p>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        {data.byEmployee.map((emp) => {
                                            const pct =
                                                data.summary.totalRevenue > 0
                                                    ? (emp.total / data.summary.totalRevenue) * 100
                                                    : 0;
                                            return (
                                                <div key={emp.username}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            marginBottom: "0.25rem",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: "0.8125rem",
                                                                fontWeight: 500,
                                                                color: "var(--text-primary)",
                                                            }}
                                                        >
                                                            {emp.name}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: "0.8125rem",
                                                                fontWeight: 600,
                                                                color: "var(--text-primary)",
                                                            }}
                                                        >
                                                            {formatCurrency(emp.total)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            height: "6px",
                                                            background: "var(--bg-secondary)",
                                                            borderRadius: "3px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${pct}%`,
                                                                height: "100%",
                                                                background: "var(--green-500)",
                                                                borderRadius: "3px",
                                                                transition: "width 0.3s ease",
                                                            }}
                                                        />
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: "0.6875rem",
                                                            color: "var(--text-muted)",
                                                        }}
                                                    >
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
