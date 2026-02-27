"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MedicineOption {
    id: string;
    name: string;
    defaultPrice: number;
    currentStock: number;
    reorderLevel: number;
    category: string | null;
}

interface Props {
    value: string;
    medicineId: string | null;
    onChange: (name: string, medicineId: string | null, defaultPrice?: number) => void;
    placeholder?: string;
    className?: string;
}

export default function MedicineAutocomplete({
    value,
    medicineId,
    onChange,
    placeholder = "Medicine name",
    className = "",
}: Props) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<MedicineOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value changes (e.g. on reset)
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.medicines || []);
                setOpen(data.medicines?.length > 0);
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal = e.target.value;
        setQuery(newVal);
        // Clear medicineId when user types freely
        onChange(newVal, null);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            search(newVal);
        }, 300);
    }

    function handleSelect(med: MedicineOption) {
        setQuery(med.name);
        setOpen(false);
        onChange(med.name, med.id, med.defaultPrice);
    }

    function stockBadge(med: MedicineOption) {
        if (med.currentStock === 0) {
            return (
                <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] font-semibold rounded bg-red-100 text-red-600">
                    Out of stock
                </span>
            );
        }
        if (med.currentStock <= med.reorderLevel) {
            return (
                <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] font-semibold rounded bg-yellow-100 text-yellow-700">
                    Low: {med.currentStock}
                </span>
            );
        }
        return (
            <span className="ml-1.5 px-1.5 py-0.5 text-[0.625rem] font-medium rounded bg-green-50 text-green-700">
                {med.currentStock} in stock
            </span>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => {
                    if (results.length > 0) setOpen(true);
                    else if (query.length >= 2) search(query);
                }}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            {/* Catalogue indicator dot */}
            {medicineId && (
                <span
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-500"
                    title="Linked to medicine catalogue"
                />
            )}

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                    {loading && (
                        <div className="px-3 py-2 text-xs text-fg-muted animate-pulse">
                            Searching...
                        </div>
                    )}
                    {!loading && results.length === 0 && (
                        <div className="px-3 py-2 text-xs text-fg-muted">No results</div>
                    )}
                    {!loading &&
                        results.map((med) => (
                            <button
                                key={med.id}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // prevent input blur
                                    handleSelect(med);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm
                                           hover:bg-surface-secondary transition-colors duration-100 cursor-pointer"
                            >
                                <div className="flex items-center gap-1 min-w-0">
                                    <span className="font-medium text-fg truncate">{med.name}</span>
                                    {med.category && (
                                        <span className="text-xs text-fg-muted shrink-0">
                                            · {med.category}
                                        </span>
                                    )}
                                    {stockBadge(med)}
                                </div>
                                <span className="text-xs text-fg-muted shrink-0 ml-2">
                                    ₹{med.defaultPrice.toFixed(2)}
                                </span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
