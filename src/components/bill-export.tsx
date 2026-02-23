"use client";

import { useRef, useState } from "react";
import { formatCurrency, formatIST } from "@/lib/utils";
import { PAYMENT_MODE_CONFIG } from "@/lib/constants";
import type { PaymentMode } from "@/lib/constants";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

export interface ExportBill {
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

interface BillExportProps {
    bill: ExportBill;
    pharmacyName?: string;
}

/* ────────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ────────────────────────────────────────────────────────────── */

async function captureCanvas(element: HTMLElement) {
    const html2canvas = (await import("html2canvas-pro")).default;
    return html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
    });
}

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

export default function BillExport({ bill, pharmacyName = "Aushadhi Ayurvedic Pharmacy" }: BillExportProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const fileName = `Bill-${bill.billNumber}`;

    // Export as Image (PNG)
    async function exportImage() {
        if (!printRef.current) return;
        setBusy("image");
        try {
            const canvas = await captureCanvas(printRef.current);
            const url = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `${fileName}.png`;
            link.href = url;
            link.click();
        } catch (err) {
            console.error("Image export failed:", err);
            alert("Failed to export image");
        } finally {
            setBusy(null);
        }
    }

    // Export as PDF
    async function exportPDF() {
        if (!printRef.current) return;
        setBusy("pdf");
        try {
            const canvas = await captureCanvas(printRef.current);
            const { jsPDF } = await import("jspdf");
            const imgData = canvas.toDataURL("image/png");
            const imgW = canvas.width;
            const imgH = canvas.height;
            // A4 width in mm = 210, margins = 10mm each side
            const pdfW = 190;
            const pdfH = (imgH * pdfW) / imgW;
            const pdf = new jsPDF("p", "mm", "a4");
            pdf.addImage(imgData, "PNG", 10, 10, pdfW, pdfH);
            pdf.save(`${fileName}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            alert("Failed to export PDF");
        } finally {
            setBusy(null);
        }
    }

    // Mobile Share (Web Share API)
    async function shareBill() {
        if (!printRef.current) return;
        setBusy("share");
        try {
            const canvas = await captureCanvas(printRef.current);
            const blob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), "image/png")
            );
            const file = new File([blob], `${fileName}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `Bill #${bill.billNumber}`,
                    text: `Bill #${bill.billNumber} — ${formatCurrency(bill.grandTotal)}`,
                    files: [file],
                });
            } else {
                // Fallback: download
                exportImage();
            }
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                console.error("Share failed:", err);
            }
        } finally {
            setBusy(null);
        }
    }

    const canShare = typeof navigator !== "undefined" && !!navigator.share;
    const paymentConfig = PAYMENT_MODE_CONFIG[bill.paymentMode as PaymentMode];

    const btnStyle: React.CSSProperties = {
        padding: "0.5rem 0.875rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        background: "var(--bg-secondary)",
        color: "var(--text-secondary)",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
    };

    return (
        <div>
            {/* ── Action Buttons ─────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={exportPDF}
                    disabled={busy !== null}
                    style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}
                >
                    📄 {busy === "pdf" ? "Generating..." : "Export PDF"}
                </button>
                <button
                    onClick={exportImage}
                    disabled={busy !== null}
                    style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}
                >
                    🖼️ {busy === "image" ? "Generating..." : "Export Image"}
                </button>
                {canShare && (
                    <button
                        onClick={shareBill}
                        disabled={busy !== null}
                        style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}
                    >
                        📤 {busy === "share" ? "Sharing..." : "Share"}
                    </button>
                )}
            </div>

            {/* ── Hidden Bill Template for Export ─────────── */}
            <div
                style={{
                    position: "absolute",
                    left: "-9999px",
                    top: 0,
                }}
            >
                <div
                    ref={printRef}
                    style={{
                        width: "400px",
                        padding: "24px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        background: "#ffffff",
                        color: "#111827",
                        fontSize: "13px",
                        lineHeight: 1.5,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "16px",
                            paddingBottom: "12px",
                            borderBottom: "2px solid #e5e7eb",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                margin: "0 0 4px",
                                color: "#111827",
                            }}
                        >
                            {pharmacyName}
                        </h2>
                        <p style={{ color: "#6b7280", fontSize: "11px", margin: 0 }}>
                            Bill #{bill.billNumber} · {formatIST(new Date(bill.createdAt))}
                        </p>
                    </div>

                    {/* Customer / Meta */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            fontSize: "12px",
                        }}
                    >
                        <span>
                            <strong>Customer:</strong>{" "}
                            {bill.customerName || "Walk-in"}
                        </span>
                        <span>
                            <strong>Payment:</strong>{" "}
                            {paymentConfig?.label || bill.paymentMode}
                        </span>
                    </div>

                    {/* Line Items Table */}
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginBottom: "12px",
                        }}
                    >
                        <thead>
                            <tr style={{ borderBottom: "1px solid #d1d5db" }}>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "6px 4px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Medicine
                                </th>
                                <th
                                    style={{
                                        textAlign: "center",
                                        padding: "6px 4px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                    }}
                                >
                                    Qty
                                </th>
                                <th
                                    style={{
                                        textAlign: "right",
                                        padding: "6px 4px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                    }}
                                >
                                    Rate
                                </th>
                                <th
                                    style={{
                                        textAlign: "right",
                                        padding: "6px 4px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                    }}
                                >
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.lineItems.map((li, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        borderBottom: "1px solid #f3f4f6",
                                    }}
                                >
                                    <td style={{ padding: "6px 4px", color: "#111827" }}>
                                        {li.medicineName}
                                    </td>
                                    <td
                                        style={{
                                            padding: "6px 4px",
                                            textAlign: "center",
                                            color: "#374151",
                                        }}
                                    >
                                        {li.quantity}
                                    </td>
                                    <td
                                        style={{
                                            padding: "6px 4px",
                                            textAlign: "right",
                                            color: "#374151",
                                        }}
                                    >
                                        {formatCurrency(li.costPerPiece)}
                                    </td>
                                    <td
                                        style={{
                                            padding: "6px 4px",
                                            textAlign: "right",
                                            fontWeight: 600,
                                            color: "#111827",
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
                            borderTop: "2px solid #e5e7eb",
                            paddingTop: "8px",
                            fontSize: "12px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "4px",
                            }}
                        >
                            <span style={{ color: "#6b7280" }}>Medicines Subtotal</span>
                            <span>{formatCurrency(bill.medicinesSubtotal)}</span>
                        </div>
                        {bill.hasPrescription && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                }}
                            >
                                <span style={{ color: "#6b7280" }}>Prescription Charge</span>
                                <span>{formatCurrency(bill.prescriptionCharge)}</span>
                            </div>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: 700,
                                fontSize: "16px",
                                marginTop: "8px",
                                paddingTop: "8px",
                                borderTop: "1px solid #e5e7eb",
                            }}
                        >
                            <span>Grand Total</span>
                            <span>{formatCurrency(bill.grandTotal)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "16px",
                            paddingTop: "12px",
                            borderTop: "1px dashed #d1d5db",
                            fontSize: "10px",
                            color: "#9ca3af",
                        }}
                    >
                        Billed by: {bill.createdByName} · Thank you!
                    </div>
                </div>
            </div>
        </div>
    );
}
