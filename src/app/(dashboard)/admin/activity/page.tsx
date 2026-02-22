"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
/*  Shared classes                                               */
/* ────────────────────────────────────────────────────────────── */

const CARD = "glass-card";
const BTN_SM =
    "px-3 py-1.5 text-xs font-medium text-fg-secondary bg-surface-secondary border border-border rounded-lg cursor-pointer hover:bg-surface-tertiary hover:text-fg transition-colors duration-150";
const BTN_SM_ACTIVE =
    "px-3 py-1.5 text-xs font-medium text-surface bg-fg border border-fg rounded-lg cursor-pointer transition-colors duration-150";
const INPUT_CLS =
    "px-2 py-1.5 text-[0.8125rem] font-mono min-w-[120px] text-fg-secondary bg-surface-secondary border border-border rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";
const TH_CLS =
    "px-3 py-2.5 text-left font-semibold text-fg-secondary text-xs uppercase tracking-wider whitespace-nowrap";
const TD_CLS = "px-3 py-2.5";

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
        <div className="min-h-screen bg-surface-secondary">

            <div className="max-w-[1100px] mx-auto p-6">
                {/* ── Filter Bar ───────────────────────────────── */}
                <div className={`${CARD} px-5 py-4 mb-4 flex items-center gap-3 flex-wrap`}>
                    <span className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">
                        Filters:
                    </span>

                    {/* Employee Filter */}
                    <select
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                        className={INPUT_CLS}
                    >
                        <option value="">All Employees</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.fullName}
                            </option>
                        ))}
                    </select>

                    {/* Payment Mode Pills */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => setFilterPayment("")}
                            className={filterPayment === "" ? BTN_SM_ACTIVE : BTN_SM}
                        >
                            All
                        </button>
                        {paymentModes.map((mode) => (
                            <button
                                key={mode}
                                onClick={() =>
                                    setFilterPayment(filterPayment === mode ? "" : mode)
                                }
                                className={filterPayment === mode ? BTN_SM_ACTIVE : BTN_SM}
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
                        className={INPUT_CLS}
                        placeholder="From"
                    />
                    <span className="text-fg-muted text-xs">to</span>
                    <input
                        type="date"
                        value={filterTo}
                        onChange={(e) => setFilterTo(e.target.value)}
                        className={INPUT_CLS}
                        placeholder="To"
                    />

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className={`${BTN_SM} text-red-600 border-red-200`}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>

                {/* ── Tabs ─────────────────────────────────────── */}
                <div className="flex gap-1 mb-4">
                    {([
                        { key: "bills", label: `Bills (${pagination?.total || 0})` },
                        { key: "summary", label: `Employee Summary (${employeeSummary.length})` },
                        { key: "audit", label: `Audit Log (${auditLogs.length})` },
                    ] as { key: Tab; label: string }[]).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={tab === key ? BTN_SM_ACTIVE : BTN_SM}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Content ──────────────────────────────────── */}
                {loading ? (
                    <div className={`${CARD} p-12 text-center text-fg-muted`}>
                        Loading...
                    </div>
                ) : error ? (
                    <div className={`${CARD} p-12 text-center text-red-600`}>
                        {error}
                    </div>
                ) : (
                    <>
                        {/* ─── Bills Tab ─────────────────────────── */}
                        {tab === "bills" && (
                            <div className={`${CARD} overflow-hidden`}>
                                {bills.length === 0 ? (
                                    <div className="p-12 text-center text-fg-muted">
                                        No bills match the current filters.
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-[0.8125rem]">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        {[
                                                            "Bill #",
                                                            "Date/Time",
                                                            "Employee",
                                                            "Payment",
                                                            "Rx",
                                                            "Items",
                                                            "Total",
                                                        ].map((h) => (
                                                            <th key={h} className={TH_CLS}>
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
                                                                className="border-b border-border last:border-b-0
                                                                           cursor-pointer hover:bg-surface-secondary
                                                                           transition-colors duration-100"
                                                            >
                                                                <td className={`${TD_CLS} font-mono font-semibold text-fg whitespace-nowrap`}>
                                                                    {bill.billNumber}
                                                                </td>
                                                                <td className={`${TD_CLS} text-fg-secondary whitespace-nowrap text-xs`}>
                                                                    {formatIST(
                                                                        new Date(bill.createdAt)
                                                                    )}
                                                                </td>
                                                                <td className={`${TD_CLS} text-fg-secondary`}>
                                                                    {bill.createdByName}
                                                                </td>
                                                                <td className={TD_CLS}>
                                                                    <span
                                                                        className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold"
                                                                        style={{
                                                                            background:
                                                                                mc?.lightBg ||
                                                                                "#f3f4f6",
                                                                            color:
                                                                                mc?.color ||
                                                                                "#374151",
                                                                        }}
                                                                    >
                                                                        {mc?.label ||
                                                                            bill.paymentMode}
                                                                    </span>
                                                                </td>
                                                                <td className={`${TD_CLS} text-fg-secondary`}>
                                                                    {bill.hasPrescription
                                                                        ? "📋"
                                                                        : "—"}
                                                                </td>
                                                                <td className={`${TD_CLS} text-fg-secondary tabular-nums`}>
                                                                    {bill.itemCount}
                                                                </td>
                                                                <td className={`${TD_CLS} font-semibold text-fg whitespace-nowrap tabular-nums`}>
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
                                            <div className="flex justify-center items-center gap-3 p-4 border-t border-border">
                                                <button
                                                    onClick={() =>
                                                        setPage((p) => Math.max(1, p - 1))
                                                    }
                                                    disabled={page <= 1}
                                                    className={`${BTN_SM} ${page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                                >
                                                    ← Prev
                                                </button>
                                                <span className="text-[0.8125rem] text-fg-secondary">
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
                                                    className={`${BTN_SM} ${page >= pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
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
                            <div className={`${CARD} overflow-hidden`}>
                                {employeeSummary.length === 0 ? (
                                    <div className="p-12 text-center text-fg-muted">
                                        No data for the current filters.
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-[0.8125rem]">
                                        <thead>
                                            <tr className="border-b border-border">
                                                {["Employee", "Username", "Bills", "Revenue"].map(
                                                    (h) => (
                                                        <th key={h} className={TH_CLS}>
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
                                                    className="border-b border-border last:border-b-0"
                                                >
                                                    <td className={`${TD_CLS} font-semibold text-fg`}>
                                                        {emp.employeeName}
                                                    </td>
                                                    <td className={`${TD_CLS} text-fg-muted font-mono`}>
                                                        {emp.employeeUser}
                                                    </td>
                                                    <td className={`${TD_CLS} text-fg-secondary tabular-nums`}>
                                                        {emp.billCount}
                                                    </td>
                                                    <td className={`${TD_CLS} font-semibold text-fg tabular-nums`}>
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
                            <div className={`${CARD} overflow-hidden`}>
                                {auditLogs.length === 0 ? (
                                    <div className="p-12 text-center text-fg-muted">
                                        No audit entries yet.
                                    </div>
                                ) : (
                                    <table className="w-full border-collapse text-[0.8125rem]">
                                        <thead>
                                            <tr className="border-b border-border">
                                                {["Action", "Bill", "By", "Notes", "Time"].map(
                                                    (h) => (
                                                        <th key={h} className={TH_CLS}>
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
                                                        className="border-b border-border last:border-b-0"
                                                    >
                                                        <td className={TD_CLS}>
                                                            <span
                                                                className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold"
                                                                style={{
                                                                    background: a.bg,
                                                                    color: a.color,
                                                                }}
                                                            >
                                                                {a.text}
                                                            </span>
                                                        </td>
                                                        <td className={`${TD_CLS} font-mono font-semibold text-fg`}>
                                                            {log.billNumber}
                                                        </td>
                                                        <td className={`${TD_CLS} text-fg-secondary`}>
                                                            {log.performedBy}
                                                        </td>
                                                        <td className={`${TD_CLS} text-fg-muted text-xs max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap`}>
                                                            {log.notes || "—"}
                                                        </td>
                                                        <td className={`${TD_CLS} text-xs text-fg-muted whitespace-nowrap`}>
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
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
                    onClick={() => setSelectedBill(null)}
                >
                    <div
                        className={`${CARD} max-w-[600px] w-full max-h-[85vh] overflow-auto p-6`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="text-center text-fg-muted p-8">
                                Loading bill details...
                            </div>
                        ) : selectedBill ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base font-bold text-fg">
                                        Bill #{selectedBill.billNumber}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedBill(null)}
                                        className={`${BTN_SM} text-sm`}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Meta Info */}
                                <div className="grid grid-cols-2 gap-2 mb-4 text-[0.8125rem]">
                                    <div>
                                        <span className="text-fg-muted">Date: </span>
                                        <span className="text-fg">
                                            {formatIST(new Date(selectedBill.createdAt))}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-fg-muted">By: </span>
                                        <span className="text-fg">
                                            {selectedBill.createdByName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-fg-muted">Payment: </span>
                                        <span className="font-semibold">
                                            {PAYMENT_MODE_CONFIG[selectedBill.paymentMode as PaymentMode]?.label || selectedBill.paymentMode}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-fg-muted">Prescription: </span>
                                        <span className="font-semibold">
                                            {selectedBill.hasPrescription ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    {selectedBill.customerName && (
                                        <div className="col-span-2">
                                            <span className="text-fg-muted">
                                                Customer:{" "}
                                            </span>
                                            <span className="text-fg">
                                                {selectedBill.customerName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Line Items */}
                                <table className="w-full border-collapse text-[0.8125rem] mb-4">
                                    <thead>
                                        <tr className="border-b border-border">
                                            {["Medicine", "Qty", "Rate", "Subtotal"].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-2.5 py-2 text-left font-semibold text-fg-secondary text-[0.6875rem] uppercase"
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
                                                className="border-b border-border last:border-b-0"
                                            >
                                                <td className="px-2.5 py-2 text-fg">
                                                    {li.medicineName}
                                                </td>
                                                <td className="px-2.5 py-2 text-fg-secondary tabular-nums">
                                                    {li.quantity}
                                                </td>
                                                <td className="px-2.5 py-2 text-fg-secondary tabular-nums">
                                                    {formatCurrency(li.costPerPiece)}
                                                </td>
                                                <td className="px-2.5 py-2 font-semibold text-fg tabular-nums">
                                                    {formatCurrency(li.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="border-t-2 border-border pt-3 text-[0.8125rem]">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-fg-secondary">
                                            Medicines Subtotal
                                        </span>
                                        <span className="text-fg tabular-nums">
                                            {formatCurrency(selectedBill.medicinesSubtotal)}
                                        </span>
                                    </div>
                                    {selectedBill.hasPrescription && (
                                        <div className="flex justify-between mb-1">
                                            <span className="text-fg-secondary">
                                                Prescription Charge
                                            </span>
                                            <span className="text-fg tabular-nums">
                                                {formatCurrency(selectedBill.prescriptionCharge)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-border">
                                        <span>Grand Total</span>
                                        <span className="text-fg tabular-nums">
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
