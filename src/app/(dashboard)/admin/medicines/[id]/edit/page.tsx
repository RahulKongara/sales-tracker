"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

const INPUT_CLS =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface text-fg placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

export default function EditMedicinePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [defaultPrice, setDefaultPrice] = useState("");
    const [reorderLevel, setReorderLevel] = useState("10");

    useEffect(() => {
        fetch(`/api/admin/medicines/${id}`)
            .then((r) => r.json())
            .then((data) => {
                const m = data.medicine;
                // Bug fix: if medicine missing, set error — the error state below will render
                if (!m) { setErrorMsg("Medicine not found"); return; }
                setName(m.name);
                setCategory(m.category || "");
                setDefaultPrice(String(m.defaultPrice));
                setReorderLevel(String(m.reorderLevel));
            })
            .catch(() => setErrorMsg("Failed to load medicine"))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg("");

        const price = parseFloat(defaultPrice);
        if (!name.trim()) { setErrorMsg("Name is required"); return; }
        if (isNaN(price) || price < 0) { setErrorMsg("Invalid price"); return; }
        // Bug fix: || 10 coerces 0 → 10; use explicit NaN check instead
        const rl = parseInt(reorderLevel);
        const reorderLevelValue = isNaN(rl) ? 10 : rl;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/medicines/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    category: category.trim() || null,
                    defaultPrice: price,
                    reorderLevel: reorderLevelValue,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update medicine");
            router.push(`/admin/medicines/${id}`);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-fg-muted border-t-fg rounded-full animate-spin" />
            </div>
        );
    }

    // Bug fix: show error state when medicine couldn't be loaded (was silently rendering empty form)
    if (errorMsg && !name) {
        return (
            <div className="p-4 sm:p-6 max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/admin/medicines"
                        className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <Package className="w-5 h-5 text-fg-muted" />
                    <h1 className="text-lg font-semibold text-fg">Edit Medicine</h1>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
                    <Link
                        href="/admin/medicines"
                        className="mt-3 inline-block text-sm text-fg-secondary hover:text-fg hover:underline"
                    >
                        ← Back to Medicines
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={`/admin/medicines/${id}`}
                    className="p-1.5 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-secondary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <Package className="w-5 h-5 text-fg-muted" />
                <h1 className="text-lg font-semibold text-fg">Edit Medicine</h1>
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
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} required />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Category <span className="text-fg-muted font-normal">(optional)</span>
                    </label>
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Analgesic" className={INPUT_CLS} />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">
                        Default Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} min="0" step="0.01" className={INPUT_CLS} required />
                </div>

                <div>
                    <label className="block text-[0.8125rem] font-medium text-fg mb-1.5">Reorder Level</label>
                    <input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} min="0" className={INPUT_CLS} />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg
                                   hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                                   transition-all duration-150 cursor-pointer shadow-sm"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <Link
                        href={`/admin/medicines/${id}`}
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
