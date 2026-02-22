"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

export default function EmailConfigPage() {
    const router = useRouter();

    const [adminEmail, setAdminEmail] = useState("");
    const [resendKey, setResendKey] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
        null
    );

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/config");
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            const data = await res.json();
            if (data.config) {
                setAdminEmail(data.config.ADMIN_EMAIL || "");
                setResendKey(data.config.RESEND_API_KEY || "");
                setFromEmail(data.config.RESEND_FROM_EMAIL || "");
            }
        } catch {
            setMessage({ type: "err", text: "Failed to load configuration" });
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const body: Record<string, string> = {};
            if (adminEmail) body.ADMIN_EMAIL = adminEmail;
            if (resendKey && !resendKey.includes("•")) body.RESEND_API_KEY = resendKey;
            if (fromEmail) body.RESEND_FROM_EMAIL = fromEmail;

            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Save failed");
            const data = await res.json();
            setMessage({
                type: "ok",
                text: `Saved: ${data.updated.join(", ")}`,
            });
            // Refresh to get masked key back
            await fetchConfig();
        } catch {
            setMessage({ type: "err", text: "Failed to save configuration" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface-secondary">

            <div className="max-w-[600px] mx-auto p-6">
                {loading ? (
                    <div className="bg-surface border border-border rounded-lg shadow-sm p-6 text-center text-fg-muted">
                        Loading...
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
                            <h2 className="text-[0.9375rem] font-bold text-fg mb-1">
                                Email Report Settings
                            </h2>
                            <p className="text-[0.8125rem] text-fg-muted mb-5">
                                Configure email delivery for daily, monthly, and annual reports.
                                Uses{" "}
                                <a
                                    href="https://resend.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-fg-secondary hover:underline"
                                >
                                    Resend
                                </a>{" "}
                                for sending.
                            </p>

                            {/* Admin Email */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary text-fg font-mono
                                               outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                />
                                <p className="text-[0.6875rem] text-fg-muted mt-1">
                                    Reports will be sent to this address.
                                </p>
                            </div>

                            {/* Resend API Key */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
                                    Resend API Key
                                </label>
                                <input
                                    type="text"
                                    value={resendKey}
                                    onChange={(e) => setResendKey(e.target.value)}
                                    placeholder="re_xxxxxxxx..."
                                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary text-fg font-mono
                                               outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                />
                                <p className="text-[0.6875rem] text-fg-muted mt-1">
                                    Get your API key from{" "}
                                    <a
                                        href="https://resend.com/api-keys"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-fg-secondary hover:underline"
                                    >
                                        resend.com/api-keys
                                    </a>
                                    . Key is masked after saving.
                                </p>
                            </div>

                            {/* From Email */}
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-fg-secondary uppercase tracking-wider mb-1.5">
                                    From Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    placeholder="onboarding@resend.dev"
                                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary text-fg font-mono
                                               outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150"
                                />
                                <p className="text-[0.6875rem] text-fg-muted mt-1">
                                    Sender address. Defaults to Resend&apos;s sandbox if blank.
                                </p>
                            </div>

                            {/* Status Message */}
                            {message && (
                                <div
                                    className={`px-3 py-2 rounded-lg text-[0.8125rem] font-medium mb-4 border
                                        ${message.type === "ok"
                                            ? "bg-green-50 text-green-600 border-green-500"
                                            : "bg-red-50 text-red-600 border-red-500"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full px-5 py-2.5 text-sm font-semibold text-fg-inverted bg-fg border-none rounded-lg
                                           cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                                           hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                            >
                                {saving ? "Saving..." : "Save Configuration"}
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-surface-secondary border border-border rounded-lg shadow-sm p-6 mt-4">
                            <h3 className="text-[0.8125rem] font-semibold text-fg-secondary mb-2">
                                📬 How Reports Work
                            </h3>
                            <ul className="text-xs text-fg-muted leading-relaxed pl-5 m-0 space-y-1">
                                <li>
                                    <strong>Daily report</strong> — triggered nightly via cron at 11 PM IST
                                </li>
                                <li>
                                    <strong>Monthly report</strong> — triggered on the last day of each month
                                </li>
                                <li>
                                    <strong>Annual report</strong> — triggered on Jan 1st for the previous year
                                </li>
                                <li>
                                    Reports include: revenue, bills count, payment breakdown, top medicines, employee performance
                                </li>
                                <li>
                                    Email delivery retries up to <strong>3 times</strong> with increasing delay
                                </li>
                            </ul>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
