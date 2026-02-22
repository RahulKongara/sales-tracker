"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import {
    PAYMENT_MODES,
    PAYMENT_MODE_CONFIG,
    PRESCRIPTION_CHARGE,
} from "@/lib/constants";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface LineItem {
    id: string;
    medicineName: string;
    quantity: number;
    costPerPiece: number;
}

/* ────────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ────────────────────────────────────────────────────────────── */

function emptyItem(): LineItem {
    return {
        id: crypto.randomUUID(),
        medicineName: "",
        quantity: 1,
        costPerPiece: 0,
    };
}

/* payment pill colour map (Tailwind classes) */
const PILL_STYLES: Record<string, { bg: string; text: string }> = {
    CASH: { bg: "bg-green-50", text: "text-green-600" },
    CARD: { bg: "bg-blue-50", text: "text-blue-600" },
    PAYTM: { bg: "bg-cyan-50", text: "text-cyan-600" },
};
void PILL_STYLES; // suppress unused warning

/* shared input classes */
const INPUT_CLS =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-fg placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

/* ────────────────────────────────────────────────────────────── */
/*  Main Component                                               */
/* ────────────────────────────────────────────────────────────── */

export default function EditBillPage() {
    const router = useRouter();
    const params = useParams();
    const billId = params.id as string;

    // ── Loading / error state ──
    const [pageLoading, setPageLoading] = useState(true);
    const [billNumber, setBillNumber] = useState("");

    // ── Form state ──
    const [customerName, setCustomerName] = useState("");
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [hasPrescription, setHasPrescription] = useState(false);
    const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()]);

    // ── UI state ──
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // ── Computed totals ──
    const medicinesSubtotal = lineItems.reduce(
        (sum, item) => sum + item.quantity * item.costPerPiece,
        0
    );
    const prescriptionCharge = hasPrescription ? PRESCRIPTION_CHARGE : 0;
    const grandTotal = medicinesSubtotal + prescriptionCharge;

    // ── Fetch existing bill ──
    const fetchBill = useCallback(async () => {
        try {
            const res = await fetch(`/api/bills/${billId}`);
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            if (res.status === 404) {
                setErrorMsg("Bill not found.");
                setPageLoading(false);
                return;
            }
            if (!res.ok) throw new Error("Failed to load bill");

            const data = await res.json();
            const bill = data.bill;

            setBillNumber(bill.billNumber);
            setCustomerName(bill.customerName || "");
            setPaymentMode(bill.paymentMode);
            setHasPrescription(bill.hasPrescription);
            setLineItems(
                bill.lineItems.map((li: { id: string; medicineName: string; quantity: number; costPerPiece: number }) => ({
                    id: li.id || crypto.randomUUID(),
                    medicineName: li.medicineName,
                    quantity: li.quantity,
                    costPerPiece: li.costPerPiece,
                }))
            );
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setPageLoading(false);
        }
    }, [billId, router]);

    useEffect(() => {
        fetchBill();
    }, [fetchBill]);

    // ── Line item handlers ──
    function updateItem(id: string, field: keyof LineItem, value: string | number) {
        setLineItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    }

    function addItem() {
        setLineItems((prev) => [...prev, emptyItem()]);
    }

    function removeItem(id: string) {
        if (lineItems.length <= 1) return;
        setLineItems((prev) => prev.filter((item) => item.id !== id));
    }

    // ── Submit ──
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const validItems = lineItems.filter(
            (item) => item.medicineName.trim() && item.quantity > 0 && item.costPerPiece > 0
        );

        if (validItems.length === 0) {
            setErrorMsg("Add at least one medicine with name, quantity, and cost.");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/api/bills/${billId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName.trim() || null,
                    paymentMode,
                    hasPrescription,
                    lineItems: validItems.map((item) => ({
                        medicineName: item.medicineName.trim(),
                        quantity: item.quantity,
                        costPerPiece: item.costPerPiece,
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update bill");
            }

            const data = await res.json();
            setSuccessMsg(
                `Bill ${data.billNumber} updated successfully!`
            );

            // Redirect back after a short delay
            setTimeout(() => {
                router.push("/admin/dashboard");
            }, 1500);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    /* ── Back navigation handler ── */
    function handleBack() {
        router.back();
    }

    /* ── Loading state ── */
    if (pageLoading) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-fg-muted border-t-fg rounded-full animate-spin mb-3" />
                    <p className="text-sm text-fg-muted">Loading bill...</p>
                </div>
            </div>
        );
    }

    /* ── Error state (bill not found) ── */
    if (errorMsg && !billNumber) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-lg font-semibold text-fg mb-1">Bill Not Found</p>
                    <p className="text-sm text-fg-muted mb-4">{errorMsg}</p>
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="px-4 py-2 text-sm font-medium text-fg-secondary bg-surface-secondary border border-border
                                   rounded-lg hover:bg-surface-tertiary hover:text-fg
                                   transition-colors duration-150 cursor-pointer"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page pb-[140px] md:pb-6">
            {/* ── Top Bar ─────────────────────────────────────── */}
            <header className="bg-surface border-b border-border sticky top-0 z-30 px-3 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1 sm:px-2 sm:py-1
                                   text-fg-secondary hover:text-fg hover:bg-surface-secondary
                                   rounded-lg transition-colors duration-150 cursor-pointer -ml-1"
                        aria-label="Go back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <path d="m12 19-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline text-sm font-medium">Back</span>
                    </button>

                    <div className="w-px h-5 bg-border hidden sm:block" />
                    <span className="text-lg sm:text-xl">✏️</span>
                    <h1 className="text-sm sm:text-base font-semibold text-fg tracking-tight">
                        Edit Bill #{billNumber}
                    </h1>
                </div>
            </header>

            {/* ── Main Content ────────────────────────────────── */}
            <div className="max-w-[800px] mx-auto px-3 py-4 sm:px-6 sm:py-6">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Success / Error Messages */}
                    {successMsg && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-green-700 dark:text-green-400">
                            ✓ {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium text-red-600 dark:text-red-400">
                            ✕ {errorMsg}
                        </div>
                    )}

                    {/* ── Line Items Card ──────────────────────── */}
                    <div className="glass-card p-3 sm:p-5">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h2 className="text-sm font-semibold text-fg">Medicines</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-xs sm:text-[0.8125rem] font-medium text-fg-secondary bg-surface-secondary border border-border
                                           rounded-lg px-2.5 py-1.5 sm:px-3 hover:bg-surface-tertiary hover:text-fg
                                           transition-colors duration-150 cursor-pointer active:scale-[0.97]"
                            >
                                + Add Row
                            </button>
                        </div>

                        {/* Desktop Table Header */}
                        <div className="hidden sm:grid grid-cols-[1fr_80px_100px_85px_36px] gap-2 pb-2 mb-2 border-b border-border">
                            <span className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">Medicine Name</span>
                            <span className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">Qty</span>
                            <span className="text-xs font-semibold text-fg-secondary uppercase tracking-wider">₹ / Piece</span>
                            <span className="text-xs font-semibold text-fg-secondary uppercase tracking-wider text-right">Subtotal</span>
                            <span />
                        </div>

                        {/* Rows */}
                        <div className="space-y-2">
                            {lineItems.map((item, idx) => (
                                <div key={item.id}>
                                    {/* ── Mobile: Card layout ── */}
                                    <div className="sm:hidden bg-surface-secondary rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-fg-muted w-5 shrink-0">
                                                {idx + 1}.
                                            </span>
                                            <input
                                                type="text"
                                                value={item.medicineName}
                                                onChange={(e) => updateItem(item.id, "medicineName", e.target.value)}
                                                placeholder={`Medicine name`}
                                                className={`${INPUT_CLS} flex-1`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                disabled={lineItems.length <= 1}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm shrink-0
                                                            transition-colors duration-150 border-none cursor-pointer
                                                            ${lineItems.length <= 1
                                                        ? "bg-transparent text-[var(--gray-300)] cursor-default"
                                                        : "bg-red-50 text-red-500 active:bg-red-600/20"
                                                    }`}
                                                aria-label="Remove item"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="flex gap-2 pl-7">
                                            <div className="flex-1">
                                                <label className="block text-[0.6875rem] text-fg-muted mb-0.5 uppercase tracking-wider">Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity || ""}
                                                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                    min={1}
                                                    className={INPUT_CLS}
                                                    inputMode="numeric"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[0.6875rem] text-fg-muted mb-0.5 uppercase tracking-wider">₹ / Piece</label>
                                                <input
                                                    type="number"
                                                    value={item.costPerPiece || ""}
                                                    onChange={(e) => updateItem(item.id, "costPerPiece", parseFloat(e.target.value) || 0)}
                                                    min={0}
                                                    step="0.01"
                                                    className={INPUT_CLS}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                            <div className="w-20 text-right">
                                                <label className="block text-[0.6875rem] text-fg-muted mb-0.5 uppercase tracking-wider">Total</label>
                                                <p className="py-2.5 text-sm font-semibold text-fg tabular-nums">
                                                    {formatCurrency(item.quantity * item.costPerPiece)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Desktop: Row layout ── */}
                                    <div className="hidden sm:grid grid-cols-[1fr_80px_100px_85px_36px] gap-2 items-center">
                                        <input
                                            type="text"
                                            value={item.medicineName}
                                            onChange={(e) => updateItem(item.id, "medicineName", e.target.value)}
                                            placeholder={`Medicine ${idx + 1}`}
                                            className="w-full px-2.5 py-1.5 text-[0.8125rem] border border-border rounded-lg bg-surface text-fg
                                                       placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                        />
                                        <input
                                            type="number"
                                            value={item.quantity || ""}
                                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                            min={1}
                                            className="w-full px-2 py-1.5 text-[0.8125rem] border border-border rounded-lg bg-surface text-fg
                                                       outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                        />
                                        <input
                                            type="number"
                                            value={item.costPerPiece || ""}
                                            onChange={(e) => updateItem(item.id, "costPerPiece", parseFloat(e.target.value) || 0)}
                                            min={0}
                                            step="0.01"
                                            className="w-full px-2 py-1.5 text-[0.8125rem] border border-border rounded-lg bg-surface text-fg
                                                       outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                        />
                                        <span className="text-[0.8125rem] font-medium text-fg text-right tabular-nums">
                                            {formatCurrency(item.quantity * item.costPerPiece)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            disabled={lineItems.length <= 1}
                                            className={`w-8 h-8 flex items-center justify-center rounded-md text-base leading-none
                                                        transition-colors duration-150 border-none bg-transparent cursor-pointer
                                                        ${lineItems.length <= 1
                                                    ? "text-[var(--gray-300)] cursor-default"
                                                    : "text-red-500 hover:bg-red-50 hover:text-red-600"
                                                }`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Customer & Payment Card ──────────────── */}
                    <div className="glass-card p-3 sm:p-5">
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                            {/* Customer Name */}
                            <div>
                                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                                    Customer Name <span className="text-fg-muted font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Walk-in customer"
                                    className={INPUT_CLS}
                                />
                            </div>

                            {/* Payment Mode Pills */}
                            <div>
                                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                                    Payment Mode
                                </label>
                                <div className="flex gap-2">
                                    {PAYMENT_MODES.map((mode) => {
                                        const active = paymentMode === mode;
                                        const pillStyle = PILL_STYLES[mode] || PILL_STYLES.CASH;
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setPaymentMode(mode)}
                                                className={`flex-1 py-2.5 text-[0.8125rem] font-medium rounded-lg border-2
                                                           cursor-pointer transition-all duration-150 active:scale-[0.97]
                                                           ${active
                                                        ? `${pillStyle.bg} ${pillStyle.text} border-current`
                                                        : "bg-surface text-fg-secondary border-border hover:border-border-strong"
                                                    }`}
                                            >
                                                {PAYMENT_MODE_CONFIG[mode].label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Prescription Toggle */}
                        <div className="mt-3 sm:mt-4 flex items-center gap-3 p-2.5 sm:p-0 bg-surface-secondary sm:bg-transparent rounded-lg sm:rounded-none">
                            <button
                                type="button"
                                onClick={() => setHasPrescription(!hasPrescription)}
                                className={`relative w-12 h-7 sm:w-11 sm:h-6 rounded-full border-none cursor-pointer transition-colors duration-200 shrink-0
                                           ${hasPrescription ? "bg-green-500" : "bg-[var(--gray-300)]"}`}
                                role="switch"
                                aria-checked={hasPrescription}
                            >
                                <span
                                    className={`absolute top-0.5 w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-white shadow-sm
                                               transition-[left] duration-200
                                               ${hasPrescription ? "left-[22px] sm:left-[22px]" : "left-0.5"}`}
                                />
                            </button>
                            <span className="text-sm sm:text-[0.8125rem] font-medium text-fg">
                                Prescription (+{formatCurrency(PRESCRIPTION_CHARGE)})
                            </span>
                        </div>
                    </div>

                    {/* ── Totals Card (Desktop only — mobile uses sticky bottom) ── */}
                    <div className="hidden md:block glass-card p-5">
                        <div className="flex justify-between mb-2 text-[0.8125rem] text-fg-secondary">
                            <span>Medicines Subtotal</span>
                            <span className="tabular-nums">{formatCurrency(medicinesSubtotal)}</span>
                        </div>
                        {hasPrescription && (
                            <div className="flex justify-between mb-2 text-[0.8125rem] text-fg-secondary">
                                <span>Prescription Charge</span>
                                <span className="tabular-nums">{formatCurrency(prescriptionCharge)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-3 border-t border-border text-lg font-bold text-fg">
                            <span>Grand Total</span>
                            <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg
                                           hover:bg-blue-700 active:scale-[0.98]
                                           disabled:opacity-60 disabled:cursor-not-allowed
                                           transition-all duration-150 cursor-pointer shadow-sm"
                            >
                                {saving ? "Saving..." : "Update Bill"}
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-4 py-2.5 text-sm font-medium text-fg-secondary bg-surface-secondary border border-border
                                           rounded-lg hover:bg-surface-tertiary hover:text-fg
                                           transition-colors duration-150 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* ── Sticky Bottom Bar (Mobile only) ──────── */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border shadow-lg px-3 py-3 safe-area-bottom">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-fg-secondary">Grand Total</span>
                            <span className="text-xl font-bold text-fg tabular-nums">{formatCurrency(grandTotal)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-3 py-2.5 text-sm font-medium text-fg-secondary bg-surface-secondary border border-border
                                           rounded-lg active:scale-[0.97] transition-all duration-150 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg
                                           active:scale-[0.98] active:bg-blue-700
                                           disabled:opacity-60 disabled:cursor-not-allowed
                                           transition-all duration-150 cursor-pointer shadow-sm"
                            >
                                {saving ? "Saving..." : "Update Bill"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
