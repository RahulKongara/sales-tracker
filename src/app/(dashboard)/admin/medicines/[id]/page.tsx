"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Pencil, Plus } from "lucide-react";

interface StockBatch {
    id: string;
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    quantityReceived: number;
    quantityRemaining: number;
    costPricePerPiece: number | null;
    notes: string | null;
    receivedAt: string;
    createdByName: string;
}

interface MedicineDetail {
    id: string;
    name: string;
    category: string | null;
    defaultPrice: number;
    reorderLevel: number;
    currentStock: number;
    isActive: boolean;
    createdAt: string;
    stockBatches: StockBatch[];
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function isExpired(iso: string) {
    return new Date(iso) < new Date();
}

function isNearExpiry(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

export default function MedicineDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [medicine, setMedicine] = useState<MedicineDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/admin/medicines/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.medicine) setMedicine(data.medicine);
                else setError("Medicine not found");
            })
            .catch(() => setError("Failed to load medicine"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-fg-muted border-t-fg rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !medicine) {
        return (
            <div className="p-6 text-center text-sm text-fg-muted">{error || "Not found"}</div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/admin/medicines"
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <Package className="w-5 h-5 text-fg-muted" />
                <h1 className="text-lg font-semibold text-fg">{medicine.name}</h1>
                <Link
                    href={`/admin/medicines/${id}/edit`}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-fg-secondary bg-surface-secondary border border-border
                               rounded-lg hover:bg-surface-tertiary hover:text-fg transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </Link>
            </div>

            {/* Info card */}
            <div className="glass-card p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">Category</p>
                    <p className="text-sm text-fg">{medicine.category || "—"}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">Default Price</p>
                    <p className="text-sm font-semibold text-fg tabular-nums">₹{medicine.defaultPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">Current Stock</p>
                    <p className={`text-sm font-semibold tabular-nums ${medicine.currentStock === 0 ? "text-red-600" : medicine.currentStock <= medicine.reorderLevel ? "text-yellow-600" : "text-green-600"}`}>
                        {medicine.currentStock}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1">Reorder Level</p>
                    <p className="text-sm text-fg">{medicine.reorderLevel}</p>
                </div>
            </div>

            {/* Stock Batches */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-fg">Stock Batches ({medicine.stockBatches.length})</h2>
                <Link
                    href={`/admin/inventory/restock?medicineId=${id}&medicineName=${encodeURIComponent(medicine.name)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg
                               hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Stock
                </Link>
            </div>

            <div className="glass-card overflow-hidden">
                {medicine.stockBatches.length === 0 ? (
                    <p className="p-6 text-sm text-fg-muted text-center">No stock batches yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface-secondary">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Batch #</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Mfg Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Expiry</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Received</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Remaining</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Cost/Piece</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicine.stockBatches.map((b) => {
                                const expired = isExpired(b.expiryDate);
                                const nearExp = isNearExpiry(b.expiryDate);
                                return (
                                    <tr
                                        key={b.id}
                                        className={`border-b border-border last:border-0 transition-colors
                                                   ${expired ? "bg-red-50/50 dark:bg-red-500/5" : nearExp ? "bg-yellow-50/50 dark:bg-yellow-500/5" : "hover:bg-surface-secondary"}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-fg">{b.batchNumber}</td>
                                        <td className="px-4 py-3 text-fg-secondary">{formatDate(b.manufactureDate)}</td>
                                        <td className="px-4 py-3">
                                            <span className={expired ? "text-red-600 font-medium" : nearExp ? "text-yellow-700 font-medium" : "text-fg-secondary"}>
                                                {formatDate(b.expiryDate)}
                                                {expired && <span className="ml-1 text-xs">(expired)</span>}
                                                {!expired && nearExp && <span className="ml-1 text-xs">(soon)</span>}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">{b.quantityReceived}</td>
                                        <td className={`px-4 py-3 text-right tabular-nums font-medium ${b.quantityRemaining === 0 ? "text-fg-muted" : "text-fg"}`}>
                                            {b.quantityRemaining}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                                            {b.costPricePerPiece ? `₹${b.costPricePerPiece.toFixed(2)}` : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
