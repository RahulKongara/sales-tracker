"use client";

import { useState } from "react";

/* ────────────────────────────────────────────────────────────────
   Minimalist Design System Showcase
   Scoped styles via CSS module-like approach (inline + CSS vars)
   to avoid conflicting with the brutalist globals.css
   ──────────────────────────────────────────────────────────────── */

const m = {
    /* Neutrals */
    white: "#FFFFFF",
    gray50: "#FAFAFA",
    gray100: "#F5F5F5",
    gray200: "#E5E5E5",
    gray300: "#D4D4D4",
    gray400: "#A3A3A3",
    gray500: "#737373",
    gray600: "#525252",
    gray800: "#262626",
    gray900: "#171717",
    black: "#0A0A0A",

    /* Accents */
    green: "#16A34A",
    greenLight: "#F0FDF4",
    red: "#DC2626",
    redLight: "#FEF2F2",
    yellow: "#D97706",
    yellowLight: "#FFFBEB",
    blue: "#2563EB",
    blueLight: "#EFF6FF",

    /* Payment */
    cash: "#16A34A",
    card: "#2563EB",
    paytm: "#06B6D4",

    /* Spacing & Radius */
    radius: "12px",
    radiusSm: "8px",
    radiusLg: "16px",
    radiusFull: "9999px",
};

/* Reusable style objects */
const s = {
    page: {
        minHeight: "100vh",
        padding: "2rem",
        maxWidth: "72rem",
        margin: "0 auto",
        background: m.white,
        color: m.gray900,
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    } as React.CSSProperties,

    sectionTitle: {
        fontSize: "0.6875rem",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        color: m.gray400,
        marginBottom: "1rem",
    } as React.CSSProperties,

    h2: {
        fontSize: "1.375rem",
        fontWeight: 600,
        color: m.gray900,
        marginBottom: "1.5rem",
        letterSpacing: "-0.01em",
    } as React.CSSProperties,

    card: {
        background: m.white,
        border: `1px solid ${m.gray200}`,
        borderRadius: m.radius,
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    } as React.CSSProperties,

    cardHover: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        borderColor: m.gray300,
    } as React.CSSProperties,

    input: {
        width: "100%",
        padding: "0.625rem 0.875rem",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        color: m.gray900,
        background: m.white,
        border: `1px solid ${m.gray200}`,
        borderRadius: m.radiusSm,
        outline: "none",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    } as React.CSSProperties,

    inputFocused: {
        borderColor: m.blue,
        boxShadow: `0 0 0 3px ${m.blueLight}`,
    } as React.CSSProperties,

    inputData: {
        width: "100%",
        padding: "0.625rem 0.875rem",
        fontSize: "0.875rem",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        color: m.gray900,
        background: m.white,
        border: `1px solid ${m.gray200}`,
        borderRadius: m.radiusSm,
        outline: "none",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        fontVariantNumeric: "tabular-nums" as const,
    } as React.CSSProperties,

    label: {
        display: "block",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: m.gray500,
        marginBottom: "0.375rem",
    } as React.CSSProperties,

    divider: {
        border: "none",
        borderTop: `1px solid ${m.gray200}`,
        margin: "0",
    } as React.CSSProperties,

    badge: (bg: string, color: string) => ({
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.625rem",
        fontSize: "0.6875rem",
        fontWeight: 500,
        borderRadius: m.radiusFull,
        background: bg,
        color: color,
        letterSpacing: "0.02em",
    }) as React.CSSProperties,

    mono: {
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontVariantNumeric: "tabular-nums" as const,
    } as React.CSSProperties,
};

/* Button component */
function MinBtn({
    variant = "primary",
    children,
}: {
    variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
    children: React.ReactNode;
}) {
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.375rem",
        padding: "0.5rem 1rem",
        fontSize: "0.8125rem",
        fontWeight: 500,
        fontFamily: "inherit",
        borderRadius: m.radiusSm,
        cursor: "pointer",
        border: "none",
        transition: "all 0.15s ease",
        letterSpacing: "0.01em",
    };

    const variants: Record<string, React.CSSProperties> = {
        primary: { ...base, background: m.gray900, color: m.white },
        secondary: { ...base, background: m.gray100, color: m.gray800, border: `1px solid ${m.gray200}` },
        danger: { ...base, background: m.redLight, color: m.red },
        success: { ...base, background: m.greenLight, color: m.green },
        ghost: { ...base, background: "transparent", color: m.gray600 },
    };

    return <button style={variants[variant]}>{children}</button>;
}

export default function MinimalShowcase() {
    const [toggle1, setToggle1] = useState(false);
    const [toggle2, setToggle2] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    return (
        <div style={s.page}>
            {/* ── Header ─────────────────────────────────── */}
            <header style={{ marginBottom: "3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span style={s.badge(m.blueLight, m.blue)}>Minimal</span>
                    <span style={{ ...s.mono, fontSize: "0.75rem", color: m.gray400 }}>v1.0</span>
                </div>
                <h1 style={{
                    fontSize: "clamp(2rem, 4vw, 2.75rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                    color: m.gray900,
                    marginBottom: "0.75rem",
                }}>
                    Pharmacy Sales<br />Dashboard
                </h1>
                <p style={{ color: m.gray500, fontSize: "1.0625rem", maxWidth: "32rem", lineHeight: 1.5 }}>
                    Clean, calm, minimal. Soft shadows and generous whitespace.
                    Designed for clarity at the counter.
                </p>
                <div style={{ marginTop: "1rem" }}>
                    <a href="/" style={{ fontSize: "0.8125rem", color: m.blue, textDecoration: "none", fontWeight: 500 }}>
                        ← Compare with Brutalist version
                    </a>
                </div>
            </header>

            {/* ── Color Palette ──────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Color Palette</h2>

                <p style={s.sectionTitle}>Neutrals</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
                    {[
                        { name: "White", hex: m.white, border: true },
                        { name: "Gray 50", hex: m.gray50 },
                        { name: "Gray 100", hex: m.gray100 },
                        { name: "Gray 200", hex: m.gray200 },
                        { name: "Gray 300", hex: m.gray300 },
                        { name: "Gray 400", hex: m.gray400 },
                        { name: "Gray 500", hex: m.gray500 },
                        { name: "Gray 600", hex: m.gray600 },
                        { name: "Gray 800", hex: m.gray800 },
                        { name: "Gray 900", hex: m.gray900 },
                    ].map((c) => (
                        <div key={c.name} style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                            <div style={{
                                height: "4rem",
                                background: c.hex,
                                borderBottom: `1px solid ${m.gray200}`,
                                ...(c.border ? { border: `1px solid ${m.gray200}`, borderRadius: `${m.radius} ${m.radius} 0 0` } : {}),
                            }} />
                            <div style={{ padding: "0.625rem" }}>
                                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: m.gray800 }}>{c.name}</p>
                                <p style={{ ...s.mono, fontSize: "0.625rem", color: m.gray400 }}>{c.hex}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p style={s.sectionTitle}>Accents</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
                    {[
                        { name: "Green", hex: m.green, light: m.greenLight, role: "Revenue / Success" },
                        { name: "Red", hex: m.red, light: m.redLight, role: "Error / Danger" },
                        { name: "Amber", hex: m.yellow, light: m.yellowLight, role: "Warning / Rx" },
                        { name: "Blue", hex: m.blue, light: m.blueLight, role: "Link / Info" },
                    ].map((c) => (
                        <div key={c.name} style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                            <div style={{ height: "3.5rem", background: c.hex }} />
                            <div style={{ height: "1.5rem", background: c.light }} />
                            <div style={{ padding: "0.625rem" }}>
                                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: m.gray800 }}>{c.name}</p>
                                <p style={{ fontSize: "0.625rem", color: m.gray400 }}>{c.role}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p style={s.sectionTitle}>Payment Modes</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                    {[
                        { name: "Cash", hex: m.cash },
                        { name: "Card", hex: m.card },
                        { name: "Paytm", hex: m.paytm },
                    ].map((c) => (
                        <div key={c.name} style={{ ...s.card, padding: 0, overflow: "hidden" }}>
                            <div style={{ height: "3rem", background: c.hex }} />
                            <div style={{ padding: "0.625rem" }}>
                                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: m.gray800 }}>{c.name}</p>
                                <p style={{ ...s.mono, fontSize: "0.625rem", color: m.gray400 }}>{c.hex}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Typography ─────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Typography</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                    <div style={s.card}>
                        <p style={s.sectionTitle}>UI Font — Space Grotesk</p>
                        <p style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
                            Pharmacy Dashboard
                        </p>
                        <p style={{ fontSize: "1.125rem", fontWeight: 500, marginBottom: "0.5rem", color: m.gray600 }}>
                            Bill Creation & Analytics
                        </p>
                        <p style={{ fontSize: "0.875rem", color: m.gray500, lineHeight: 1.6 }}>
                            The quick brown fox jumps over the lazy dog.
                            Every medicine sold, every rupee tracked.
                        </p>
                    </div>

                    <div style={s.card}>
                        <p style={s.sectionTitle}>Data Font — JetBrains Mono</p>
                        <p style={{ ...s.mono, fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>₹24,580.00</p>
                        <p style={{ ...s.mono, fontSize: "1.125rem", fontWeight: 500, marginBottom: "0.5rem", color: m.gray600 }}>
                            QTY: 142 units
                        </p>
                        <p style={{ ...s.mono, fontSize: "0.875rem", color: m.gray500 }}>
                            Bill #20250217-0042
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Buttons ────────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Buttons</h2>
                <div style={s.card}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                        <MinBtn variant="primary">Save Bill</MinBtn>
                        <MinBtn variant="secondary">Back to Edit</MinBtn>
                        <MinBtn variant="success">Confirm & Save</MinBtn>
                        <MinBtn variant="danger">Delete Bill</MinBtn>
                        <MinBtn variant="ghost">Cancel</MinBtn>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: m.gray400 }}>
                        Minimal buttons use subtle background fills instead of heavy borders. Danger and success use tinted backgrounds.
                    </p>
                </div>
            </section>

            {/* ── Inputs ─────────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Inputs</h2>
                <div style={s.card}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <label style={s.label}>Medicine Name</label>
                            <input style={s.input} placeholder="e.g. Paracetamol 500mg" />
                        </div>
                        <div>
                            <label style={s.label}>Customer Name</label>
                            <input style={s.input} placeholder="Optional" />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <label style={s.label}>Quantity</label>
                            <input style={s.inputData} type="number" placeholder="0" />
                        </div>
                        <div>
                            <label style={s.label}>Cost / Piece (₹)</label>
                            <input style={s.inputData} type="number" placeholder="0.00" />
                        </div>
                        <div>
                            <label style={s.label}>Subtotal</label>
                            <div style={{ ...s.inputData, background: m.gray50, cursor: "default", fontWeight: 600 }}>₹0.00</div>
                        </div>
                        <div>
                            <label style={s.label}>Error State</label>
                            <input
                                style={{ ...s.input, borderColor: m.red, boxShadow: `0 0 0 3px ${m.redLight}` }}
                                placeholder="Required"
                            />
                        </div>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: m.gray400 }}>
                        Inputs use subtle borders with a blue ring on focus. Error states get a red ring.
                    </p>
                </div>
            </section>

            {/* ── Payment Mode ───────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Payment Mode Selection</h2>
                <div style={s.card}>
                    <label style={s.label}>Select Payment Mode</label>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", marginTop: "0.375rem" }}>
                        {[
                            { key: "CASH", label: "₹ Cash", color: m.cash, light: m.greenLight },
                            { key: "CARD", label: "Card", color: m.card, light: m.blueLight },
                            { key: "PAYTM", label: "Paytm", color: m.paytm, light: "#ECFEFF" },
                        ].map((pm) => (
                            <button
                                key={pm.key}
                                onClick={() => setSelectedPayment(pm.key)}
                                style={{
                                    padding: "0.5rem 1rem",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    fontFamily: "inherit",
                                    cursor: "pointer",
                                    borderRadius: m.radiusFull,
                                    transition: "all 0.15s ease",
                                    ...(selectedPayment === pm.key
                                        ? { background: pm.color, color: m.white, border: `1.5px solid ${pm.color}` }
                                        : { background: m.white, color: m.gray600, border: `1.5px solid ${m.gray200}` }),
                                }}
                            >
                                {pm.label}
                            </button>
                        ))}
                    </div>
                    <p style={{ ...s.mono, fontSize: "0.75rem", color: m.gray400 }}>
                        Selected: {selectedPayment ?? "None"}
                    </p>
                </div>
            </section>

            {/* ── Toggles ────────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Toggles</h2>
                <div style={s.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <button
                                onClick={() => setToggle1(!toggle1)}
                                style={{
                                    width: "2.75rem",
                                    height: "1.5rem",
                                    borderRadius: m.radiusFull,
                                    border: "none",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "background 0.2s ease",
                                    background: toggle1 ? m.green : m.gray200,
                                }}
                            >
                                <span style={{
                                    position: "absolute",
                                    top: "2px",
                                    left: toggle1 ? "calc(100% - 1.25rem - 2px)" : "2px",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    borderRadius: "50%",
                                    background: m.white,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    transition: "left 0.2s ease",
                                }} />
                            </button>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: m.gray600 }}>
                                Doctor&apos;s Prescription
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <button
                                onClick={() => setToggle2(!toggle2)}
                                style={{
                                    width: "2.75rem",
                                    height: "1.5rem",
                                    borderRadius: m.radiusFull,
                                    border: "none",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "background 0.2s ease",
                                    background: toggle2 ? m.green : m.gray200,
                                }}
                            >
                                <span style={{
                                    position: "absolute",
                                    top: "2px",
                                    left: toggle2 ? "calc(100% - 1.25rem - 2px)" : "2px",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    borderRadius: "50%",
                                    background: m.white,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                    transition: "left 0.2s ease",
                                }} />
                            </button>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: m.gray600 }}>
                                Active (On)
                            </span>
                        </div>
                    </div>
                    {toggle1 && (
                        <span style={s.badge(m.yellowLight, m.yellow)}>+ ₹350 Prescription Charge</span>
                    )}
                </div>
            </section>

            {/* ── Badges ─────────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Badges</h2>
                <div style={s.card}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={s.badge(m.greenLight, m.green)}>Saved</span>
                        <span style={s.badge(m.redLight, m.red)}>Deleted</span>
                        <span style={s.badge(m.yellowLight, m.yellow)}>Prescription</span>
                        <span style={s.badge(m.blueLight, m.blue)}>Admin</span>
                        <span style={s.badge(m.gray100, m.gray600)}>Employee</span>
                        <span style={s.badge(m.greenLight, m.cash)}>Cash</span>
                        <span style={s.badge(m.blueLight, m.card)}>Card</span>
                        <span style={s.badge("#ECFEFF", m.paytm)}>Paytm</span>
                    </div>
                </div>
            </section>

            {/* ── Cards ──────────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Cards</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                    {/* KPI Card */}
                    <div
                        style={{
                            ...s.card,
                            ...(hoveredCard === "kpi" ? s.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard("kpi")}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <p style={s.sectionTitle}>Today&apos;s Revenue</p>
                        <p style={{ ...s.mono, fontSize: "2rem", fontWeight: 700, color: m.green, marginBottom: "0.25rem" }}>
                            ₹24,580
                        </p>
                        <p style={{ ...s.mono, fontSize: "0.8125rem", color: m.gray400 }}>42 bills</p>
                    </div>

                    {/* Payment Stream Card */}
                    <div
                        style={{
                            ...s.card,
                            ...(hoveredCard === "stream" ? s.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard("stream")}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <p style={s.sectionTitle}>Payment Stream</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {[
                                { label: "Cash", value: "₹12,400", color: m.cash, pct: 50 },
                                { label: "Card", value: "₹8,200", color: m.card, pct: 33 },
                                { label: "Paytm", value: "₹3,980", color: m.paytm, pct: 17 },
                            ].map((st) => (
                                <div key={st.label}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                                        <span style={{ color: m.gray600 }}>{st.label}</span>
                                        <span style={{ ...s.mono, color: m.gray800 }}>{st.value}</span>
                                    </div>
                                    <div style={{ height: "6px", background: m.gray100, borderRadius: m.radiusFull, overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${st.pct}%`,
                                            background: st.color,
                                            borderRadius: m.radiusFull,
                                            transition: "width 0.5s ease",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hover Card */}
                    <div
                        style={{
                            ...s.card,
                            cursor: "pointer",
                            ...(hoveredCard === "hover" ? s.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredCard("hover")}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <p style={s.sectionTitle}>Hover Me</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: m.gray800 }}>
                            Interactive Card
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: m.gray500, lineHeight: 1.5 }}>
                            Cards use a soft shadow lift on hover — the opposite approach to
                            brutalist shadow collapse.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Sample Bill ────────────────────────────── */}
            <section style={{ marginBottom: "3.5rem" }}>
                <h2 style={s.h2}>Sample Bill Preview</h2>
                <div style={{ ...s.card, maxWidth: "28rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                        <div>
                            <p style={{ ...s.mono, fontSize: "0.6875rem", color: m.gray400, marginBottom: "0.125rem" }}>BILL #</p>
                            <p style={{ ...s.mono, fontSize: "1.125rem", fontWeight: 700 }}>20250217-0042</p>
                        </div>
                        <span style={s.badge(m.greenLight, m.cash)}>Cash</span>
                    </div>

                    <hr style={s.divider} />

                    <div style={{ margin: "1rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {[
                            { name: "Paracetamol 500mg", qty: 10, cost: 2.50, sub: 25.00 },
                            { name: "Amoxicillin 250mg", qty: 3, cost: 18.00, sub: 54.00 },
                            { name: "Cetirizine 10mg", qty: 5, cost: 4.00, sub: 20.00 },
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.name}</p>
                                    <p style={{ ...s.mono, fontSize: "0.6875rem", color: m.gray400 }}>
                                        {item.qty} × ₹{item.cost.toFixed(2)}
                                    </p>
                                </div>
                                <p style={{ ...s.mono, fontSize: "0.875rem", fontWeight: 600 }}>₹{item.sub.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <hr style={s.divider} />

                    <div style={{ margin: "0.75rem 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.375rem" }}>
                            <span style={{ color: m.gray500 }}>Medicines Subtotal</span>
                            <span style={{ ...s.mono, fontWeight: 500 }}>₹99.00</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: m.yellow }}>
                            <span style={{ fontWeight: 500 }}>Prescription Charge</span>
                            <span style={{ ...s.mono, fontWeight: 500 }}>₹350.00</span>
                        </div>
                    </div>

                    <hr style={{ ...s.divider, borderTopWidth: "2px", borderColor: m.gray300 }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Grand Total</span>
                        <span style={{ ...s.mono, fontSize: "1.5rem", fontWeight: 700, color: m.green }}>₹449.00</span>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────── */}
            <footer style={{ borderTop: `1px solid ${m.gray200}`, paddingTop: "1.5rem", paddingBottom: "3rem" }}>
                <p style={{ ...s.mono, fontSize: "0.6875rem", color: m.gray400 }}>
                    Pharmacy Sales Dashboard · Minimal Design System · v1.0
                </p>
            </footer>
        </div>
    );
}
