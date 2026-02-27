"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

const INPUT_CLS =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-fg placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

export default function NewMedicinePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [defaultPrice, setDefaultPrice] = useState("");
    const [reorderLevel, setReorderLevel] = useState("10");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");

        const price = parseFloat(defaultPrice);
        if (!name.trim()) { setErrorMsg("Name is required"); return; }
        if (isNaN(price) || price < 0) { setErrorMsg("Invalid price"); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/medicines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    category: category.trim() || undefined,
                    defaultPrice: price,
                    reorderLevel: parseInt(reorderLevel) || 10,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create medicine");
            router.push("/admin/medicines");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/admin/medicines"
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <Package className="w-5 h-5 text-fg-muted" />
                <h1 className="text-lg font-semibold text-fg">Add Medicine</h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
                {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Paracetamol 500mg"
                        className={INPUT_CLS}
                        required
                    />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Category <span className="text-fg-muted font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Analgesic, Antibiotic"
                        className={INPUT_CLS}
                    />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Default Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={defaultPrice}
                        onChange={(e) => setDefaultPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={INPUT_CLS}
                        required
                    />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Reorder Level
                    </label>
                    <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(e.target.value)}
                        min="0"
                        placeholder="10"
                        className={INPUT_CLS}
                    />
                    <p className="text-xs text-fg-muted mt-1">Alert when stock falls at or below this quantity</p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg
                                   hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
                                   transition-all duration-150 cursor-pointer shadow-sm"
                    >
                        {saving ? "Saving..." : "Add Medicine"}
                    </button>
                    <Link
                        href="/admin/medicines"
                        className="px-4 py-2.5 text-sm font-medium text-fg-secondary bg-surface-secondary border border-border
                                   rounded-lg hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
