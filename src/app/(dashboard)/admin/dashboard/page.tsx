"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { formatCurrency, formatISTTime } from "@/lib/utils";
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
/*  Styles                                                       */
/* ────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
};

const btnDanger: React.CSSProperties = {
    padding: "0.375rem 0.625rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--red-600)",
    background: "var(--red-50)",
    border: "1px solid var(--red-200, #FECACA)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "all 0.15s ease",
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

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

// Helper: today's date in IST as YYYY-MM-DD
function todayIST() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
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
            <div
                style={{
                    minHeight: "100vh",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                }}
            >
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--red-600)",
                    fontSize: "0.875rem",
                }}
            >
                {error}
            </div>
        );
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
                    <span style={{ fontSize: "1.25rem" }}>📊</span>
                    <h1
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Admin Dashboard
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        onClick={() => router.push("/bills/new")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        + New Bill
                    </button>
                    <button
                        onClick={() => router.push("/admin/analytics")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        📈 Analytics
                    </button>
                    <button
                        onClick={() => router.push("/admin/activity")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        📋 Activity
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
                        onClick={() => router.push("/admin/config")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        ⚙️ Config
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

            {/* ── Content ─────────────────────────────────────────── */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>

                {/* ── Date Picker Row ──────────────────────────────── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1rem",
                    }}
                >
                    <label
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                        }}
                    >
                        📅 View date:
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        max={todayIST()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            ...btnSecondary,
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.8125rem",
                        }}
                    />
                    {!isToday && (
                        <button
                            onClick={() => setSelectedDate(todayIST())}
                            style={{
                                ...btnSecondary,
                                fontSize: "0.75rem",
                                padding: "0.375rem 0.75rem",
                            }}
                        >
                            ← Back to Today
                        </button>
                    )}
                    {isToday && (
                        <span
                            style={{
                                fontSize: "0.6875rem",
                                color: "var(--text-muted)",
                            }}
                        >
                            Auto-refreshes every 30s
                        </span>
                    )}
                </div>

                {/* ── Stats Cards Row ─────────────────────────────────── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* Total Revenue */}
                    <div style={{ ...card, padding: "1.25rem" }}>
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
                            {dateLabel}&apos;s Revenue
                        </p>
                        <p
                            style={{
                                fontSize: "1.75rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {formatCurrency(stats?.totalRevenue || 0)}
                        </p>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                marginTop: "0.25rem",
                            }}
                        >
                            {stats?.billCount || 0} bills
                        </p>
                    </div>

                    {/* Payment Mode Breakdown */}
                    {paymentModes.map((mode) => {
                        const config = PAYMENT_MODE_CONFIG[mode];
                        const amount = stats?.byPaymentMode[mode] || 0;
                        const count = stats?.billCountByMode[mode] || 0;
                        return (
                            <div key={mode} style={{ ...card, padding: "1.25rem" }}>
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
                                    {config.label}
                                </p>
                                <p
                                    style={{
                                        fontSize: "1.5rem",
                                        fontWeight: 700,
                                        color: config.color,
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {formatCurrency(amount)}
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "var(--text-muted)",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    {count} bill{count !== 1 ? "s" : ""}
                                </p>
                            </div>
                        );
                    })}
                    {/* Prescription Summary */}
                    <div style={{ ...card, padding: "1.25rem" }}>
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
                            Prescriptions
                        </p>
                        <p
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                color: "var(--blue-600, #2563EB)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {stats?.prescriptionCount || 0} Rx
                        </p>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                                marginTop: "0.25rem",
                            }}
                        >
                            {stats?.nonPrescriptionCount || 0} OTC · {formatCurrency(stats?.totalPrescriptionCharges || 0)} charges
                        </p>
                    </div>
                </div>

                {/* ── Payment Stream Proportion Bar ────────────────── */}
                {(stats?.totalRevenue || 0) > 0 && (
                    <div style={{ ...card, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: "0.5rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Payment Stream
                        </p>
                        <div
                            style={{
                                display: "flex",
                                borderRadius: "var(--radius)",
                                overflow: "hidden",
                                height: "28px",
                            }}
                        >
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
                                        style={{
                                            width: `${pct}%`,
                                            background: config.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontSize: "0.6875rem",
                                            fontWeight: 600,
                                            minWidth: pct > 8 ? "auto" : "0",
                                            overflow: "hidden",
                                            transition: "width 0.3s ease",
                                        }}
                                    >
                                        {pct > 12 ? `${config.label} ${pct.toFixed(0)}%` : ""}
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "1rem",
                                marginTop: "0.5rem",
                                flexWrap: "wrap",
                            }}
                        >
                            {paymentModes.map((mode) => {
                                const amount = stats?.byPaymentMode[mode] || 0;
                                const config = PAYMENT_MODE_CONFIG[mode];
                                return (
                                    <span
                                        key={mode}
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "var(--text-secondary)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.375rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "2px",
                                                background: config.color,
                                                display: "inline-block",
                                            }}
                                        />
                                        {config.label}: {formatCurrency(amount)}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Bills Table ────────────────────────────────────── */}
                <div style={{ ...card, overflow: "hidden" }}>
                    <div
                        style={{
                            padding: "1rem 1.25rem",
                            borderBottom: "1px solid var(--border-default)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                            }}
                        >
                            {dateLabel}&apos;s Bills ({stats?.bills.length || 0})
                        </h2>
                        <button
                            onClick={fetchStats}
                            style={{
                                ...btnSecondary,
                                fontSize: "0.6875rem",
                                padding: "0.25rem 0.5rem",
                            }}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {!stats?.bills.length ? (
                        <div
                            style={{
                                padding: "3rem",
                                textAlign: "center",
                                color: "var(--text-muted)",
                                fontSize: "0.875rem",
                            }}
                        >
                            No bills for this date.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "0.8125rem",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom: "1px solid var(--border-default)",
                                        }}
                                    >
                                        {[
                                            "Bill #",
                                            "Time",
                                            "Customer",
                                            "Items",
                                            "Payment",
                                            "Rx",
                                            "Total",
                                            "By",
                                            "",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: "0.625rem 0.75rem",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    color: "var(--text-secondary)",
                                                    fontSize: "0.75rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                    whiteSpace: "nowrap",
                                                }}
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
                                                style={{
                                                    borderBottom: "1px solid var(--border-light)",
                                                    transition: "background 0.1s",
                                                }}
                                                onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    "var(--bg-secondary)")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background = "transparent")
                                                }
                                            >
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        fontFamily: "var(--font-mono)",
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {bill.billNumber}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        color: "var(--text-secondary)",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {formatISTTime(new Date(bill.createdAt))}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {bill.customerName || (
                                                        <span style={{ color: "var(--text-muted)" }}>
                                                            Walk-in
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    {bill.itemCount}
                                                </td>
                                                <td style={{ padding: "0.625rem 0.75rem" }}>
                                                    <span
                                                        style={{
                                                            padding: "0.125rem 0.5rem",
                                                            borderRadius: "var(--radius-sm)",
                                                            background: modeConfig?.lightBg || "#f3f4f6",
                                                            color: modeConfig?.color || "#374151",
                                                            fontSize: "0.6875rem",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {modeConfig?.label || bill.paymentMode}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    {bill.hasPrescription ? "📋" : "—"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {formatCurrency(bill.grandTotal)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.625rem 0.75rem",
                                                        color: "var(--text-muted)",
                                                        fontSize: "0.75rem",
                                                    }}
                                                >
                                                    {bill.createdByUser}
                                                </td>
                                                <td style={{ padding: "0.625rem 0.75rem" }}>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(bill.id, bill.billNumber)
                                                        }
                                                        disabled={deletingId === bill.id}
                                                        style={{
                                                            ...btnDanger,
                                                            opacity: deletingId === bill.id ? 0.5 : 1,
                                                        }}
                                                    >
                                                        {deletingId === bill.id ? "..." : "Delete"}
                                                    </button>
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
