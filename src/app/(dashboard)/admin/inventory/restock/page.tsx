"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Warehouse } from "lucide-react";
import MedicineAutocomplete from "@/components/MedicineAutocomplete";

const INPUT_CLS =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-fg placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

const SELECT_CLS =
    "px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-fg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

const MONTHS = [
    { value: "1", label: "Jan" }, { value: "2", label: "Feb" },
    { value: "3", label: "Mar" }, { value: "4", label: "Apr" },
    { value: "5", label: "May" }, { value: "6", label: "Jun" },
    { value: "7", label: "Jul" }, { value: "8", label: "Aug" },
    { value: "9", label: "Sep" }, { value: "10", label: "Oct" },
    { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];

/* ── Date math helpers ──────────────────────────────────────── */

/** Add n months to a mm/yyyy, returns { month, year } */
function addMonths(mm: number, yyyy: number, n: number): { month: number; year: number } {
    const d = new Date(yyyy, mm - 1 + n, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/** Month difference (expiry - manufacture). Can be negative. */
function monthDiff(mfgMM: number, mfgYY: number, expMM: number, expYY: number): number {
    return (expYY - mfgYY) * 12 + (expMM - mfgMM);
}

/* ── MonthYearInput sub-component ───────────────────────────── */

interface MonthYearInputProps {
    month: string;
    year: string;
    onMonthChange: (v: string) => void;
    onYearChange: (v: string) => void;
    yearPlaceholder?: string;
}

function MonthYearInput({ month, year, onMonthChange, onYearChange, yearPlaceholder = "YYYY" }: MonthYearInputProps) {
    return (
        <div className="flex gap-2">
            <select
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
                className={`${SELECT_CLS} w-28`}
            >
                <option value="">Month</option>
                {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
            <input
                type="number"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                placeholder={yearPlaceholder}
                min="2000"
                max="2099"
                className={`${INPUT_CLS} w-24`}
            />
        </div>
    );
}

/* ── Main form ──────────────────────────────────────────────── */

function RestockForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [medicineName, setMedicineName] = useState(searchParams.get("medicineName") || "");
    const [medicineId, setMedicineId] = useState<string | null>(searchParams.get("medicineId") || null);
    const [batchNumber, setBatchNumber] = useState("");

    // Manufacture date: month + year
    const [mfgMonth, setMfgMonth] = useState("");
    const [mfgYear, setMfgYear] = useState("");

    // Expiry date: two linked inputs
    const [expMonth, setExpMonth] = useState("");
    const [expYear, setExpYear] = useState("");
    const [durationMonths, setDurationMonths] = useState("");

    const [quantityReceived, setQuantityReceived] = useState("");
    const [costPricePerPiece, setCostPricePerPiece] = useState("");
    const [notes, setNotes] = useState("");

    // Sync medicine from query params
    useEffect(() => {
        const qid = searchParams.get("medicineId");
        const qname = searchParams.get("medicineName");
        if (qid && qname) {
            setMedicineId(qid);
            setMedicineName(qname);
        }
    }, [searchParams]);

    /* ── Sync handlers ──────────────────────────────────────── */

    function handleMfgMonthChange(val: string) {
        setMfgMonth(val);
        syncAfterMfgChange(val, mfgYear);
    }

    function handleMfgYearChange(val: string) {
        setMfgYear(val);
        syncAfterMfgChange(mfgMonth, val);
    }

    /**
     * When manufacture date changes:
     * - If duration is set → recalculate exp date from mfg + duration
     * - Else if exp date is set → recalculate duration from mfg + exp
     */
    function syncAfterMfgChange(mm: string, yyyy: string) {
        const mM = parseInt(mm), mY = parseInt(yyyy);
        if (isNaN(mM) || isNaN(mY)) return;

        const dur = parseInt(durationMonths);
        if (!isNaN(dur) && dur > 0) {
            // Duration is the "source of truth" — recalc exp date
            const { month, year } = addMonths(mM, mY, dur);
            setExpMonth(String(month));
            setExpYear(String(year));
        } else {
            const eM = parseInt(expMonth), eY = parseInt(expYear);
            if (!isNaN(eM) && !isNaN(eY)) {
                const diff = monthDiff(mM, mY, eM, eY);
                setDurationMonths(diff > 0 ? String(diff) : "");
            }
        }
    }

    /**
     * When expiry MM/YYYY is directly edited:
     * - Recalculate duration from mfg + new exp date (if mfg is set)
     */
    function handleExpMonthChange(val: string) {
        setExpMonth(val);
        syncDurationFromExp(val, expYear);
    }

    function handleExpYearChange(val: string) {
        setExpYear(val);
        syncDurationFromExp(expMonth, val);
    }

    function syncDurationFromExp(mm: string, yyyy: string) {
        const eM = parseInt(mm), eY = parseInt(yyyy);
        const mM = parseInt(mfgMonth), mY = parseInt(mfgYear);
        if (isNaN(eM) || isNaN(eY) || isNaN(mM) || isNaN(mY)) return;
        const diff = monthDiff(mM, mY, eM, eY);
        setDurationMonths(diff > 0 ? String(diff) : "");
    }

    /**
     * When duration is edited:
     * - Recalculate exp date from mfg + duration (if mfg is set)
     */
    function handleDurationChange(val: string) {
        setDurationMonths(val);
        const dur = parseInt(val);
        const mM = parseInt(mfgMonth), mY = parseInt(mfgYear);
        if (isNaN(dur) || dur < 1 || isNaN(mM) || isNaN(mY)) return;
        const { month, year } = addMonths(mM, mY, dur);
        setExpMonth(String(month));
        setExpYear(String(year));
    }

    /* ── Submit ─────────────────────────────────────────────── */

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!medicineId) { setErrorMsg("Please select a medicine from the catalogue"); return; }
        if (!batchNumber.trim()) { setErrorMsg("Batch number is required"); return; }

        const mM = parseInt(mfgMonth), mY = parseInt(mfgYear);
        if (!mfgMonth || isNaN(mM) || mM < 1 || mM > 12) { setErrorMsg("Select a valid manufacture month"); return; }
        if (!mfgYear || isNaN(mY) || mY < 2000) { setErrorMsg("Enter a valid manufacture year (2000+)"); return; }

        const eM = parseInt(expMonth), eY = parseInt(expYear);
        if (!expMonth || isNaN(eM) || eM < 1 || eM > 12) { setErrorMsg("Select a valid expiry month"); return; }
        if (!expYear || isNaN(eY) || eY < 2000) { setErrorMsg("Enter a valid expiry year (2000+)"); return; }

        // Manufacture = 1st of month; Expiry = last day of month
        const mfgDate = new Date(mY, mM - 1, 1);
        const expDate = new Date(eY, eM, 0); // day 0 of next month = last day of expiry month

        if (expDate <= mfgDate) { setErrorMsg("Expiry date must be after manufacture date"); return; }

        const qty = parseInt(quantityReceived);
        if (!qty || qty < 1) { setErrorMsg("Quantity must be at least 1"); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/inventory/stock-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    medicineId,
                    batchNumber: batchNumber.trim(),
                    manufactureDate: mfgDate.toISOString(),
                    expiryDate: expDate.toISOString(),
                    quantityReceived: qty,
                    costPricePerPiece: costPricePerPiece ? parseFloat(costPricePerPiece) : undefined,
                    notes: notes.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add stock");

            setSuccessMsg(`Stock entry added: batch ${data.batch.batchNumber}, ${data.batch.quantityReceived} units.`);
            setBatchNumber("");
            setMfgMonth(""); setMfgYear("");
            setExpMonth(""); setExpYear(""); setDurationMonths("");
            setQuantityReceived("");
            setCostPricePerPiece("");
            setNotes("");

            setTimeout(() => router.push("/admin/inventory"), 1500);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    /* ── Derived display ────────────────────────────────────── */

    // Show a resolved expiry preview like "Jun 2027" when both fields are filled
    const expPreview = (() => {
        const eM = parseInt(expMonth), eY = parseInt(expYear);
        if (isNaN(eM) || isNaN(eY) || eM < 1 || eM > 12) return null;
        const label = MONTHS.find((m) => m.value === expMonth)?.label;
        return label ? `${label} ${eY}` : null;
    })();

    return (
        <form onSubmit={handleSubmit} className="glass-card p-5 space-y-5">
            {successMsg && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                    {errorMsg}
                </div>
            )}

            {/* Medicine */}
            <div>
                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                    Medicine <span className="text-red-500">*</span>
                </label>
                <MedicineAutocomplete
                    value={medicineName}
                    medicineId={medicineId}
                    onChange={(name, medId) => { setMedicineName(name); setMedicineId(medId); }}
                    placeholder="Search medicine catalogue..."
                    className={INPUT_CLS}
                />
                {!medicineId && medicineName && (
                    <p className="text-xs text-yellow-600 mt-1">
                        Select a medicine from the catalogue.{" "}
                        <Link href="/admin/medicines/new" className="underline">Add new medicine</Link>
                    </p>
                )}
            </div>

            {/* Batch Number */}
            <div>
                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                    Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. BT-2025-001"
                    className={INPUT_CLS}
                />
            </div>

            {/* Manufacture Date */}
            <div>
                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                    Manufacture Date <span className="text-red-500">*</span>
                </label>
                <MonthYearInput
                    month={mfgMonth}
                    year={mfgYear}
                    onMonthChange={handleMfgMonthChange}
                    onYearChange={handleMfgYearChange}
                />
            </div>

            {/* Expiry Date — two linked inputs */}
            <div className="rounded-lg border border-border bg-surface-secondary p-3 space-y-3">
                <p className="text-[0.8125rem] font-medium text-fg">
                    Expiry Date <span className="text-red-500">*</span>
                    {expPreview && (
                        <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                            → {expPreview}
                        </span>
                    )}
                </p>

                {/* Option A: direct MM/YYYY */}
                <div>
                    <p className="text-xs text-fg-muted mb-1.5 uppercase tracking-wider font-semibold">Month / Year</p>
                    <MonthYearInput
                        month={expMonth}
                        year={expYear}
                        onMonthChange={handleExpMonthChange}
                        onYearChange={handleExpYearChange}
                    />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-fg-muted">or</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Option B: duration from manufacture */}
                <div>
                    <p className="text-xs text-fg-muted mb-1.5 uppercase tracking-wider font-semibold">Months from manufacture</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={durationMonths}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            min="1"
                            max="120"
                            placeholder="e.g. 24"
                            className={`${INPUT_CLS} w-28`}
                        />
                        <span className="text-sm text-fg-muted">months</span>
                    </div>
                    {!mfgMonth && !mfgYear && (
                        <p className="text-xs text-fg-muted mt-1">Fill manufacture date first to auto-calculate expiry.</p>
                    )}
                </div>
            </div>

            {/* Quantity + Cost */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Quantity Received <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={quantityReceived}
                        onChange={(e) => setQuantityReceived(e.target.value)}
                        min="1"
                        placeholder="0"
                        className={INPUT_CLS}
                    />
                </div>
                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Cost / Piece (₹) <span className="text-fg-muted font-normal">(optional)</span>
                    </label>
                    <input
                        type="number"
                        value={costPricePerPiece}
                        onChange={(e) => setCostPricePerPiece(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={INPUT_CLS}
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                    Notes <span className="text-fg-muted font-normal">(optional)</span>
                </label>
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Supplier, invoice reference, etc."
                    className={INPUT_CLS}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg
                               hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
                               transition-all duration-150 cursor-pointer shadow-sm"
                >
                    {saving ? "Saving..." : "Add Stock"}
                </button>
                <Link
                    href="/admin/inventory"
                    className="px-4 py-2.5 text-sm font-medium text-fg-secondary bg-surface-secondary border border-border
                               rounded-lg hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}

export default function RestockPage() {
    return (
        <div className="p-4 sm:p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/admin/inventory"
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <Warehouse className="w-5 h-5 text-fg-muted" />
                <h1 className="text-lg font-semibold text-fg">Add Stock Entry</h1>
            </div>
            <Suspense fallback={<div className="text-sm text-fg-muted animate-pulse p-4">Loading...</div>}>
                <RestockForm />
            </Suspense>
        </div>
    );
}
