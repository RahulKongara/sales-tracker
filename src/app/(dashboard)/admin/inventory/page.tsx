"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Warehouse, Plus, AlertTriangle, Clock } from "lucide-react";

interface Batch {
    id: string;
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    quantityReceived: number;
    quantityRemaining: number;
    costPricePerPiece: number | null;
    receivedAt: string;
}

interface LowStockItem {
    id: string;
    name: string;
    category: string | null;
    currentStock: number;
    reorderLevel: number;
}

interface NearExpiryBatch {
    id: string;
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    expiryDate: string;
    quantityRemaining: number;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function daysUntilExpiry(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function InventoryPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [nearExpiry, setNearExpiry] = useState<NearExpiryBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/inventory")
            .then((r) => r.json())
            .then((data) => {
                setBatches(data.batches || []);
                setLowStock(data.lowStockMedicines || []);
                setNearExpiry(data.nearExpiryBatches || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Warehouse className="w-5 h-5 text-fg-muted" />
                    <div>
                        <h1 className="text-lg font-semibold text-fg">Inventory</h1>
                        <p className="text-sm text-fg-muted">Stock batches and alerts</p>
                    </div>
                </div>
                <Link
                    href="/admin/inventory/restock"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg
                               hover:bg-green-700 transition-colors duration-150 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Stock
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12 text-sm text-fg-muted animate-pulse">Loading inventory...</div>
            ) : (
                <>
                    {/* Low Stock Alerts */}
                    {lowStock.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <h2 className="text-sm font-semibold text-fg">
                                    Low Stock Alerts ({lowStock.length})
                                </h2>
                            </div>
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-secondary">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Medicine</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Category</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Stock</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Reorder Level</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStock.map((m) => (
                                            <tr key={m.id} className="border-b border-border last:border-0 bg-yellow-50/30 dark:bg-yellow-500/5">
                                                <td className="px-4 py-3 font-medium text-fg">
                                                    <Link href={`/admin/medicines/${m.id}`} className="hover:text-blue-600 hover:underline">
                                                        {m.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-fg-secondary">{m.category || "—"}</td>
                                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">{m.currentStock}</td>
                                                <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">{m.reorderLevel}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/admin/inventory/restock?medicineId=${m.id}&medicineName=${encodeURIComponent(m.name)}`}
                                                        className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                                                    >
                                                        + Add Stock
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Near Expiry */}
                    {nearExpiry.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <h2 className="text-sm font-semibold text-fg">
                                    Near Expiry — within 30 days ({nearExpiry.length})
                                </h2>
                            </div>
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-secondary">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Medicine</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Batch</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Expires</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nearExpiry.map((b) => {
                                            const days = daysUntilExpiry(b.expiryDate);
                                            return (
                                                <tr key={b.id} className={`border-b border-border last:border-0 ${days <= 7 ? "bg-red-50/40 dark:bg-red-500/5" : "bg-orange-50/30 dark:bg-orange-500/5"}`}>
                                                    <td className="px-4 py-3 font-medium text-fg">
                                                        <Link href={`/admin/medicines/${b.medicineId}`} className="hover:text-blue-600 hover:underline">
                                                            {b.medicineName}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-fg-secondary">{b.batchNumber}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`font-medium ${days <= 7 ? "text-red-600" : "text-orange-600"}`}>
                                                            {formatDate(b.expiryDate)}
                                                        </span>
                                                        <span className="ml-1.5 text-xs text-fg-muted">({days}d left)</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">{b.quantityRemaining}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* All Batches */}
                    <section>
                        <h2 className="text-sm font-semibold text-fg mb-3">All Batches ({batches.length})</h2>
                        <div className="glass-card overflow-hidden">
                            {batches.length === 0 ? (
                                <p className="p-6 text-center text-sm text-fg-muted">No stock batches. <Link href="/admin/inventory/restock" className="text-blue-600 hover:underline">Add stock</Link></p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-secondary">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Medicine</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Batch</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Expiry</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Received</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batches.map((b) => {
                                            const expired = new Date(b.expiryDate) < new Date();
                                            const near = !expired && daysUntilExpiry(b.expiryDate) <= 30;
                                            return (
                                                <tr
                                                    key={b.id}
                                                    className={`border-b border-border last:border-0 transition-colors
                                                               ${expired ? "bg-red-50/40 dark:bg-red-500/5 opacity-70" : near ? "bg-yellow-50/40 dark:bg-yellow-500/5" : "hover:bg-surface-secondary"}`}
                                                >
                                                    <td className="px-4 py-3 font-medium text-fg">
                                                        <Link href={`/admin/medicines/${b.medicineId}`} className="hover:text-blue-600 hover:underline">
                                                            {b.medicineName}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-fg-secondary">{b.batchNumber}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={expired ? "text-red-500" : near ? "text-yellow-700 dark:text-yellow-400" : "text-fg-secondary"}>
                                                            {formatDate(b.expiryDate)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">{b.quantityReceived}</td>
                                                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${b.quantityRemaining === 0 ? "text-fg-muted" : "text-fg"}`}>
                                                        {b.quantityRemaining}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
