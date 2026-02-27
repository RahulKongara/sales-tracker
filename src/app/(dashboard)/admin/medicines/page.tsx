"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, XCircle, Package } from "lucide-react";

interface Medicine {
    id: string;
    name: string;
    category: string | null;
    defaultPrice: number;
    reorderLevel: number;
    currentStock: number;
    isActive: boolean;
}

function StockBadge({ stock, reorder }: { stock: number; reorder: number }) {
    if (stock === 0) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                Out of stock
            </span>
        );
    }
    if (stock <= reorder) {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                Low: {stock}
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            {stock}
        </span>
    );
}

export default function MedicinesPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [deactivating, setDeactivating] = useState<string | null>(null);

    const fetchMedicines = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (category) params.set("category", category);
            if (lowStockOnly) params.set("lowStock", "true");
            const res = await fetch(`/api/admin/medicines?${params}`);
            if (res.ok) {
                const data = await res.json();
                setMedicines(data.medicines);
            }
        } finally {
            setLoading(false);
        }
    }, [query, category, lowStockOnly]);

    useEffect(() => {
        fetchMedicines();
    }, [fetchMedicines]);

    async function handleDeactivate(id: string, name: string) {
        if (!confirm(`Deactivate "${name}"? It will no longer appear in autocomplete.`)) return;
        setDeactivating(id);
        try {
            await fetch(`/api/admin/medicines/${id}`, { method: "DELETE" });
            setMedicines((prev) => prev.filter((m) => m.id !== id));
        } finally {
            setDeactivating(null);
        }
    }

    const categories = [...new Set(medicines.map((m) => m.category).filter(Boolean))];

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-fg-muted" />
                    <div>
                        <h1 className="text-lg font-semibold text-fg">Medicines</h1>
                        <p className="text-sm text-fg-muted">Catalogue of all medicines</p>
                    </div>
                </div>
                <Link
                    href="/admin/medicines/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg
                               hover:bg-green-700 transition-colors duration-150 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Medicine
                </Link>
            </div>

            {/* Filters */}
            <div className="glass-card p-3 mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg
                                   placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c!}>{c}</option>
                    ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-fg-secondary cursor-pointer px-2">
                    <input
                        type="checkbox"
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                        className="w-4 h-4 rounded"
                    />
                    Low stock only
                </label>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-fg-muted animate-pulse">Loading...</div>
                ) : medicines.length === 0 ? (
                    <div className="p-8 text-center text-sm text-fg-muted">
                        No medicines found.{" "}
                        <Link href="/admin/medicines/new" className="text-blue-600 hover:underline">
                            Add one
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface-secondary">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Stock</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Default Price</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-secondary uppercase tracking-wider">Reorder Level</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map((m) => (
                                <tr
                                    key={m.id}
                                    className={`border-b border-border last:border-0 hover:bg-surface-secondary transition-colors
                                               ${!m.isActive ? "opacity-50" : ""}`}
                                >
                                    <td className="px-4 py-3 font-medium text-fg">
                                        <Link href={`/admin/medicines/${m.id}`} className="hover:text-blue-600 hover:underline">
                                            {m.name}
                                        </Link>
                                        {!m.isActive && (
                                            <span className="ml-2 text-xs text-fg-muted">(inactive)</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-fg-secondary">
                                        {m.category || <span className="text-fg-muted">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StockBadge stock={m.currentStock} reorder={m.reorderLevel} />
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-fg">
                                        ₹{m.defaultPrice.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-fg-secondary">
                                        {m.reorderLevel}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Link
                                                href={`/admin/medicines/${m.id}/edit`}
                                                className="p-1.5 rounded-md text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            {m.isActive && (
                                                <button
                                                    onClick={() => handleDeactivate(m.id, m.name)}
                                                    disabled={deactivating === m.id}
                                                    className="p-1.5 rounded-md text-fg-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Deactivate"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
