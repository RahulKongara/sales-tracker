"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { formatIST, formatCurrency } from "@/lib/utils";
import { PAYMENT_MODE_CONFIG } from "@/lib/constants";
import type { PaymentMode } from "@/lib/constants";
import BillExport from "@/components/bill-export";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface BillEntry {
    id: string;
    billNumber: string;
    createdAt: string;
    customerName: string | null;
    paymentMode: string;
    hasPrescription: boolean;
    prescriptionCharge: number;
    grandTotal: number;
    itemCount: number;
    createdByName: string;
    createdByUser: string;
    createdById: string;
}

interface EmployeeSummary {
    employeeId: string;
    employeeName: string;
    employeeUser: string;
    billCount: number;
    totalRevenue: number;
}

interface AuditEntry {
    id: string;
    action: string;
    billNumber: string;
    performedBy: string;
    performedByUser: string;
    notes: string | null;
    timestamp: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface BillDetail {
    id: string;
    billNumber: string;
    createdAt: string;
    customerName: string | null;
    paymentMode: string;
    hasPrescription: boolean;
    prescriptionCharge: number;
    medicinesSubtotal: number;
    grandTotal: number;
    createdByName: string;
    lineItems: {
        medicineName: string;
        quantity: number;
        costPerPiece: number;
        subtotal: number;
    }[];
}

interface Employee {
    id: string;
    fullName: string;
    username: string;
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

const btnSmall: React.CSSProperties = {
    ...btnSecondary,
    fontSize: "0.75rem",
    padding: "0.375rem 0.75rem",
};

const inputStyle: React.CSSProperties = {
    ...btnSecondary,
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    minWidth: "120px",
};

const pillActive: React.CSSProperties = {
    ...btnSmall,
    background: "var(--text-primary)",
    color: "var(--bg-primary)",
    borderColor: "var(--text-primary)",
};

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

type Tab = "bills" | "summary" | "audit";

export default function ActivityLogPage() {
    const router = useRouter();

    // Data
    const [bills, setBills] = useState<BillEntry[]>([]);
    const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);

    // Filters
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterPayment, setFilterPayment] = useState("");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");

    // UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState<Tab>("bills");
    const [selectedBill, setSelectedBill] = useState<BillDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Fetch employee list for filter dropdown
    useEffect(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((d) => setEmployees(d.users || []))
            .catch(() => { });
    }, []);

    // Build query string from filters
    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "25");
        if (filterEmployee) params.set("employee", filterEmployee);
        if (filterPayment) params.set("paymentMode", filterPayment);
        if (filterFrom) params.set("from", filterFrom);
        if (filterTo) params.set("to", filterTo);
        return params.toString();
    }, [page, filterEmployee, filterPayment, filterFrom, filterTo]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/admin/activity?${buildQuery()}`);
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            if (!res.ok) throw new Error("Failed to load activity data");
            const data = await res.json();
            setBills(data.bills);
            setPagination(data.pagination);
            setEmployeeSummary(data.employeeSummary);
            setAuditLogs(data.auditLogs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [buildQuery, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filterEmployee, filterPayment, filterFrom, filterTo]);

    // Bill detail click
    async function openBillDetail(billId: string) {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/bills/${billId}`);
            if (!res.ok) throw new Error("Failed to load bill");
            const data = await res.json();
            setSelectedBill(data.bill);
        } catch {
            alert("Could not load bill details");
        } finally {
            setDetailLoading(false);
        }
    }

    const clearFilters = () => {
        setFilterEmployee("");
        setFilterPayment("");
        setFilterFrom("");
        setFilterTo("");
    };

    const hasFilters = filterEmployee || filterPayment || filterFrom || filterTo;

    const actionLabel: Record<string, { text: string; color: string; bg: string }> = {
        DELETE: { text: "Deleted", color: "var(--red-600)", bg: "var(--red-50)" },
        EDIT: { text: "Edited", color: "var(--amber-600)", bg: "var(--amber-50)" },
    };

    const paymentModes: PaymentMode[] = ["CASH", "CARD", "PAYTM"];

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
            {/* ── Header ──────────────────────────────────────── */}
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
                    <span style={{ fontSize: "1.25rem" }}>📋</span>
                    <h1
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Activity Log
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button onClick={() => router.push("/admin/dashboard")} style={btnSmall}>
                        ← Dashboard
                    </button>
                    <button onClick={() => router.push("/admin/analytics")} style={btnSmall}>
                        📈 Analytics
                    </button>
                    <button onClick={() => router.push("/admin/users")} style={btnSmall}>
                        👥 Users
                    </button>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} style={btnSmall}>
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
                {/* ── Filter Bar ───────────────────────────────── */}
                <div
                    style={{
                        ...card,
                        padding: "1rem 1.25rem",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Filters:
                    </span>

                    {/* Employee Filter */}
                    <select
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">All Employees</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.fullName}
                            </option>
                        ))}
                    </select>

                    {/* Payment Mode Pills */}
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                            onClick={() => setFilterPayment("")}
                            style={filterPayment === "" ? pillActive : btnSmall}
                        >
                            All
                        </button>
                        {paymentModes.map((mode) => (
                            <button
                                key={mode}
                                onClick={() =>
                                    setFilterPayment(filterPayment === mode ? "" : mode)
                                }
                                style={filterPayment === mode ? pillActive : btnSmall}
                            >
                                {PAYMENT_MODE_CONFIG[mode].label}
                            </button>
                        ))}
                    </div>

                    {/* Date Range */}
                    <input
                        type="date"
                        value={filterFrom}
                        onChange={(e) => setFilterFrom(e.target.value)}
                        style={inputStyle}
                        placeholder="From"
                    />
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>to</span>
                    <input
                        type="date"
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        style={inputStyle}
                        placeholder="To"
                    />

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            style={{
                                ...btnSmall,
                                color: "var(--red-600)",
                                borderColor: "var(--red-200, #FECACA)",
                            }}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>

                {/* ── Tabs ─────────────────────────────────────── */}
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
                    {([
                        { key: "bills", label: `Bills (${pagination?.total || 0})` },
                        { key: "summary", label: `Employee Summary (${employeeSummary.length})` },
                        { key: "audit", label: `Audit Log (${auditLogs.length})` },
                    ] as { key: Tab; label: string }[]).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            style={tab === key ? pillActive : btnSmall}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Content ──────────────────────────────────── */}
                {loading ? (
                    <div
                        style={{
                            ...card,
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                        }}
                    >
                        Loading...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            ...card,
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--red-600)",
                        }}
                    >
                        {error}
                    </div>
                ) : (
                    <>
                        {/* ─── Bills Tab ─────────────────────────── */}
                        {tab === "bills" && (
                            <div style={{ ...card, overflow: "hidden" }}>
                                {bills.length === 0 ? (
                                    <div
                                        style={{
                                            padding: "3rem",
                                            textAlign: "center",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No bills match the current filters.
                                    </div>
                                ) : (
                                    <>
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
                                                            borderBottom:
                                                                "1px solid var(--border-default)",
                                                        }}
                                                    >
                                                        {[
                                                            "Bill #",
                                                            "Date/Time",
                                                            "Employee",
                                                            "Payment",
                                                            "Rx",
                                                            "Items",
                                                            "Total",
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
                                                    {bills.map((bill) => {
                                                        const mc =
                                                            PAYMENT_MODE_CONFIG[
                                                            bill.paymentMode as PaymentMode
                                                            ];
                                                        return (
                                                            <tr
                                                                key={bill.id}
                                                                onClick={() =>
                                                                    openBillDetail(bill.id)
                                                                }
                                                                style={{
                                                                    borderBottom:
                                                                        "1px solid var(--border-light)",
                                                                    cursor: "pointer",
                                                                    transition:
                                                                        "background 0.1s",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    "var(--bg-secondary)")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background =
                                                                    "transparent")
                                                                }
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        fontFamily:
                                                                            "var(--font-mono)",
                                                                        fontWeight: 600,
                                                                        color: "var(--text-primary)",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {bill.billNumber}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        color: "var(--text-secondary)",
                                                                        whiteSpace: "nowrap",
                                                                        fontSize: "0.75rem",
                                                                    }}
                                                                >
                                                                    {formatIST(
                                                                        new Date(bill.createdAt)
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        color: "var(--text-secondary)",
                                                                    }}
                                                                >
                                                                    {bill.createdByName}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            padding:
                                                                                "0.125rem 0.5rem",
                                                                            borderRadius:
                                                                                "var(--radius-sm)",
                                                                            background:
                                                                                mc?.lightBg ||
                                                                                "#f3f4f6",
                                                                            color:
                                                                                mc?.color ||
                                                                                "#374151",
                                                                            fontSize:
                                                                                "0.6875rem",
                                                                            fontWeight: 600,
                                                                        }}
                                                                    >
                                                                        {mc?.label ||
                                                                            bill.paymentMode}
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        color: "var(--text-secondary)",
                                                                    }}
                                                                >
                                                                    {bill.hasPrescription
                                                                        ? "📋"
                                                                        : "—"}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        color: "var(--text-secondary)",
                                                                    }}
                                                                >
                                                                    {bill.itemCount}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "0.625rem 0.75rem",
                                                                        fontWeight: 600,
                                                                        color: "var(--text-primary)",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {formatCurrency(
                                                                        bill.grandTotal
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {pagination && pagination.totalPages > 1 && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    padding: "1rem",
                                                    borderTop:
                                                        "1px solid var(--border-default)",
                                                }}
                                            >
                                                <button
                                                    onClick={() =>
                                                        setPage((p) => Math.max(1, p - 1))
                                                    }
                                                    disabled={page <= 1}
                                                    style={{
                                                        ...btnSmall,
                                                        opacity: page <= 1 ? 0.5 : 1,
                                                    }}
                                                >
                                                    ← Prev
                                                </button>
                                                <span
                                                    style={{
                                                        fontSize: "0.8125rem",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    Page {page} of {pagination.totalPages}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        setPage((p) =>
                                                            Math.min(
                                                                pagination.totalPages,
                                                                p + 1
                                                            )
                                                        )
                                                    }
                                                    disabled={page >= pagination.totalPages}
                                                    style={{
                                                        ...btnSmall,
                                                        opacity:
                                                            page >= pagination.totalPages
                                                                ? 0.5
                                                                : 1,
                                                    }}
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ─── Employee Summary Tab ──────────────── */}
                        {tab === "summary" && (
                            <div style={{ ...card, overflow: "hidden" }}>
                                {employeeSummary.length === 0 ? (
                                    <div
                                        style={{
                                            padding: "3rem",
                                            textAlign: "center",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No data for the current filters.
                                    </div>
                                ) : (
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
                                                    borderBottom:
                                                        "1px solid var(--border-default)",
                                                }}
                                            >
                                                {["Employee", "Username", "Bills", "Revenue"].map(
                                                    (h) => (
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
                                                            }}
                                                        >
                                                            {h}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeSummary.map((emp) => (
                                                <tr
                                                    key={emp.employeeId}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid var(--border-light)",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: "0.625rem 0.75rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-primary)",
                                                        }}
                                                    >
                                                        {emp.employeeName}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "0.625rem 0.75rem",
                                                            color: "var(--text-muted)",
                                                            fontFamily: "var(--font-mono)",
                                                        }}
                                                    >
                                                        {emp.employeeUser}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "0.625rem 0.75rem",
                                                            color: "var(--text-secondary)",
                                                        }}
                                                    >
                                                        {emp.billCount}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: "0.625rem 0.75rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-primary)",
                                                        }}
                                                    >
                                                        {formatCurrency(emp.totalRevenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* ─── Audit Log Tab ────────────────────── */}
                        {tab === "audit" && (
                            <div style={{ ...card, overflow: "hidden" }}>
                                {auditLogs.length === 0 ? (
                                    <div
                                        style={{
                                            padding: "3rem",
                                            textAlign: "center",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No audit entries yet.
                                    </div>
                                ) : (
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
                                                    borderBottom:
                                                        "1px solid var(--border-default)",
                                                }}
                                            >
                                                {["Action", "Bill", "By", "Notes", "Time"].map(
                                                    (h) => (
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
                                                            }}
                                                        >
                                                            {h}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.map((log) => {
                                                const a = actionLabel[log.action] || {
                                                    text: log.action,
                                                    color: "var(--text-secondary)",
                                                    bg: "var(--bg-secondary)",
                                                };
                                                return (
                                                    <tr
                                                        key={log.id}
                                                        style={{
                                                            borderBottom:
                                                                "1px solid var(--border-light)",
                                                        }}
                                                    >
                                                        <td
                                                            style={{
                                                                padding: "0.625rem 0.75rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    padding: "0.125rem 0.5rem",
                                                                    borderRadius:
                                                                        "var(--radius-sm)",
                                                                    background: a.bg,
                                                                    color: a.color,
                                                                    fontSize: "0.6875rem",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {a.text}
                                                            </span>
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "0.625rem 0.75rem",
                                                                fontFamily: "var(--font-mono)",
                                                                fontWeight: 600,
                                                                color: "var(--text-primary)",
                                                            }}
                                                        >
                                                            {log.billNumber}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "0.625rem 0.75rem",
                                                                color: "var(--text-secondary)",
                                                            }}
                                                        >
                                                            {log.performedBy}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "0.625rem 0.75rem",
                                                                color: "var(--text-muted)",
                                                                fontSize: "0.75rem",
                                                                maxWidth: "250px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {log.notes || "—"}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "0.625rem 0.75rem",
                                                                fontSize: "0.75rem",
                                                                color: "var(--text-muted)",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {formatIST(
                                                                new Date(log.timestamp)
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Bill Detail Modal ────────────────────────── */}
            {(selectedBill || detailLoading) && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "1rem",
                    }}
                    onClick={() => setSelectedBill(null)}
                >
                    <div
                        style={{
                            ...card,
                            maxWidth: "600px",
                            width: "100%",
                            maxHeight: "85vh",
                            overflow: "auto",
                            padding: "1.5rem",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    color: "var(--text-muted)",
                                    padding: "2rem",
                                }}
                            >
                                Loading bill details...
                            </div>
                        ) : selectedBill ? (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "1rem",
                                            fontWeight: 700,
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        Bill #{selectedBill.billNumber}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedBill(null)}
                                        style={{
                                            ...btnSmall,
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Meta Info */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.5rem",
                                        marginBottom: "1rem",
                                        fontSize: "0.8125rem",
                                    }}
                                >
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>Date: </span>
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {formatIST(new Date(selectedBill.createdAt))}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>By: </span>
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {selectedBill.createdByName}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>Payment: </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {PAYMENT_MODE_CONFIG[selectedBill.paymentMode as PaymentMode]?.label || selectedBill.paymentMode}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: "var(--text-muted)" }}>Prescription: </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {selectedBill.hasPrescription ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    {selectedBill.customerName && (
                                        <div style={{ gridColumn: "1/3" }}>
                                            <span style={{ color: "var(--text-muted)" }}>
                                                Customer:{" "}
                                            </span>
                                            <span style={{ color: "var(--text-primary)" }}>
                                                {selectedBill.customerName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Line Items */}
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "0.8125rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                borderBottom: "1px solid var(--border-default)",
                                            }}
                                        >
                                            {["Medicine", "Qty", "Rate", "Subtotal"].map((h) => (
                                                <th
                                                    key={h}
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        color: "var(--text-secondary)",
                                                        fontSize: "0.6875rem",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBill.lineItems.map((li, i) => (
                                            <tr
                                                key={i}
                                                style={{
                                                    borderBottom: "1px solid var(--border-light)",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {li.medicineName}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    {li.quantity}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    {formatCurrency(li.costPerPiece)}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "0.5rem 0.625rem",
                                                        fontWeight: 600,
                                                        color: "var(--text-primary)",
                                                    }}
                                                >
                                                    {formatCurrency(li.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div
                                    style={{
                                        borderTop: "2px solid var(--border-default)",
                                        paddingTop: "0.75rem",
                                        fontSize: "0.8125rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        <span style={{ color: "var(--text-secondary)" }}>
                                            Medicines Subtotal
                                        </span>
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {formatCurrency(selectedBill.medicinesSubtotal)}
                                        </span>
                                    </div>
                                    {selectedBill.hasPrescription && (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "0.25rem",
                                            }}
                                        >
                                            <span style={{ color: "var(--text-secondary)" }}>
                                                Prescription Charge
                                            </span>
                                            <span style={{ color: "var(--text-primary)" }}>
                                                {formatCurrency(selectedBill.prescriptionCharge)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            marginTop: "0.5rem",
                                            paddingTop: "0.5rem",
                                            borderTop: "1px solid var(--border-default)",
                                        }}
                                    >
                                        <span>Grand Total</span>
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {formatCurrency(selectedBill.grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* Export Buttons */}
                                <BillExport bill={selectedBill} />
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
