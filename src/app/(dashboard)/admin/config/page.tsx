"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

/* ────────────────────────────────────────────────────────────── */
/*  Styles                                                       */
/* ────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    padding: "1.5rem",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
};

const btnPrimary: React.CSSProperties = {
    padding: "0.625rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#fff",
    background: "var(--text-primary)",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
};

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
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
            {/* ── Header ──────────────────────────────────────── */}
            <header
                style={{
                    background: "var(--bg-primary)",
                    borderBottom: "1px solid var(--border-default)",
                    padding: "0.75rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>⚙️</span>
                    <h1
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        Email Configuration
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button onClick={() => router.push("/admin/dashboard")} style={btnSmall}>
                        ← Dashboard
                    </button>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} style={btnSmall}>
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem" }}>
                {loading ? (
                    <div style={{ ...card, textAlign: "center", color: "var(--text-muted)" }}>
                        Loading...
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div style={card}>
                            <h2
                                style={{
                                    fontSize: "0.9375rem",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    marginBottom: "0.25rem",
                                }}
                            >
                                Email Report Settings
                            </h2>
                            <p
                                style={{
                                    fontSize: "0.8125rem",
                                    color: "var(--text-muted)",
                                    marginBottom: "1.25rem",
                                }}
                            >
                                Configure email delivery for daily, monthly, and annual reports.
                                Uses{" "}
                                <a
                                    href="https://resend.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Resend
                                </a>{" "}
                                for sending.
                            </p>

                            {/* Admin Email */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Admin Email</label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    style={inputStyle}
                                />
                                <p
                                    style={{
                                        fontSize: "0.6875rem",
                                        color: "var(--text-muted)",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    Reports will be sent to this address.
                                </p>
                            </div>

                            {/* Resend API Key */}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={labelStyle}>Resend API Key</label>
                                <input
                                    type="text"
                                    value={resendKey}
                                    onChange={(e) => setResendKey(e.target.value)}
                                    placeholder="re_xxxxxxxx..."
                                    style={inputStyle}
                                />
                                <p
                                    style={{
                                        fontSize: "0.6875rem",
                                        color: "var(--text-muted)",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    Get your API key from{" "}
                                    <a
                                        href="https://resend.com/api-keys"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        resend.com/api-keys
                                    </a>
                                    . Key is masked after saving.
                                </p>
                            </div>

                            {/* From Email */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={labelStyle}>From Email (Optional)</label>
                                <input
                                    type="email"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    placeholder="onboarding@resend.dev"
                                    style={inputStyle}
                                />
                                <p
                                    style={{
                                        fontSize: "0.6875rem",
                                        color: "var(--text-muted)",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    Sender address. Defaults to Resend&apos;s sandbox if blank.
                                </p>
                            </div>

                            {/* Status Message */}
                            {message && (
                                <div
                                    style={{
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "var(--radius)",
                                        fontSize: "0.8125rem",
                                        fontWeight: 500,
                                        marginBottom: "1rem",
                                        background:
                                            message.type === "ok"
                                                ? "var(--green-50, #F0FDF4)"
                                                : "var(--red-50, #FEF2F2)",
                                        color:
                                            message.type === "ok"
                                                ? "var(--green-600, #16A34A)"
                                                : "var(--red-600)",
                                        border: `1px solid ${message.type === "ok"
                                                ? "var(--green-200, #BBF7D0)"
                                                : "var(--red-200, #FECACA)"
                                            }`,
                                    }}
                                >
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...btnPrimary,
                                    opacity: saving ? 0.6 : 1,
                                    width: "100%",
                                }}
                            >
                                {saving ? "Saving..." : "Save Configuration"}
                            </button>
                        </div>

                        {/* Info Card */}
                        <div
                            style={{
                                ...card,
                                marginTop: "1rem",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                📬 How Reports Work
                            </h3>
                            <ul
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                    lineHeight: 1.8,
                                    paddingLeft: "1.25rem",
                                    margin: 0,
                                }}
                            >
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
