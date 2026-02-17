"use client";

import { useState } from "react";

export default function DesignShowcase() {
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-12">
        <p className="font-data text-sm tracking-widest uppercase mb-2"
          style={{ color: "var(--text-secondary)" }}>
          Design System v1.0
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none mb-3">
          PHARMACY SALES
          <br />
          DASHBOARD
        </h1>
        <div className="brutal-divider mb-4" />
        <p style={{ color: "var(--text-secondary)" }} className="text-lg max-w-xl">
          Brutalist design system — raw, honest, functional. Every element
          serves the counter staff and admin with zero decoration.
        </p>
        <a href="/minimal" className="inline-block mt-3 text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--brutal-blue)" }}>
          Compare with Minimal version →
        </a>
      </header>

      {/* ── Color Palette ───────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Color Palette
        </h2>

        {/* Neutrals */}
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-3"
          style={{ color: "var(--text-secondary)" }}>
          Neutrals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { name: "Black", var: "--brutal-black", hex: "#0A0A0A", light: true },
            { name: "Charcoal", var: "--brutal-charcoal", hex: "#2A2A2A", light: true },
            { name: "Ash", var: "--brutal-ash", hex: "#3D3D3D", light: true },
            { name: "Cement", var: "--brutal-cement", hex: "#C4BBB2", light: false },
            { name: "Bone", var: "--brutal-bone", hex: "#E8E0D8", light: false },
            { name: "White", var: "--brutal-white", hex: "#F5F0EB", light: false },
          ].map((c) => (
            <div key={c.name} className="brutal-card-static p-0 overflow-hidden">
              <div className="h-20 md:h-24" style={{ background: `var(${c.var})` }} />
              <div className="p-3">
                <p className="text-xs font-bold uppercase">{c.name}</p>
                <p className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.hex}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Accents */}
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-3"
          style={{ color: "var(--text-secondary)" }}>
          Accents
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { name: "Green", var: "--brutal-green", hex: "#2A9D3E", role: "Revenue / Success" },
            { name: "Red", var: "--brutal-red", hex: "#D63031", role: "Error / Danger" },
            { name: "Yellow", var: "--brutal-yellow", hex: "#F9A825", role: "Warning / Rx Charge" },
            { name: "Blue", var: "--brutal-blue", hex: "#1565C0", role: "Link / Info" },
          ].map((c) => (
            <div key={c.name} className="brutal-card-static p-0 overflow-hidden">
              <div className="h-20 md:h-24" style={{ background: `var(${c.var})` }} />
              <div className="p-3">
                <p className="text-xs font-bold uppercase">{c.name}</p>
                <p className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.hex}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  {c.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Modes */}
        <h3 className="text-sm uppercase tracking-widest font-semibold mb-3"
          style={{ color: "var(--text-secondary)" }}>
          Payment Modes
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Cash", var: "--brutal-cash", hex: "#2A9D3E" },
            { name: "Card", var: "--brutal-card", hex: "#1565C0" },
            { name: "Paytm", var: "--brutal-paytm", hex: "#00BAF2" },
          ].map((c) => (
            <div key={c.name} className="brutal-card-static p-0 overflow-hidden">
              <div className="h-16 md:h-20" style={{ background: `var(${c.var})` }} />
              <div className="p-3">
                <p className="text-xs font-bold uppercase">{c.name}</p>
                <p className="font-data text-xs" style={{ color: "var(--text-muted)" }}>
                  {c.hex}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography ──────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Typography
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="brutal-card-static p-6">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4"
              style={{ color: "var(--text-secondary)" }}>
              UI Font — Space Grotesk
            </p>
            <p className="text-3xl font-bold mb-2">Pharmacy Dashboard</p>
            <p className="text-xl font-semibold mb-2">Bill Creation & Analytics</p>
            <p className="text-base mb-2">
              The quick brown fox jumps over the lazy dog. Every medicine sold,
              every rupee tracked.
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Secondary text · Labels · Captions · Helper text
            </p>
          </div>

          <div className="brutal-card-static p-6">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4"
              style={{ color: "var(--text-secondary)" }}>
              Data Font — JetBrains Mono
            </p>
            <p className="font-data text-3xl font-bold mb-2">₹24,580.00</p>
            <p className="font-data text-xl font-semibold mb-2">QTY: 142 units</p>
            <p className="font-data text-base mb-2">
              Bill #20250217-0042
            </p>
            <p className="font-data text-sm" style={{ color: "var(--text-secondary)" }}>
              0123456789 · ₹ · % · .00
            </p>
          </div>
        </div>
      </section>

      {/* ── Buttons ─────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Buttons
        </h2>
        <div className="brutal-card-static p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button className="brutal-btn brutal-btn-primary">
              Save Bill
            </button>
            <button className="brutal-btn brutal-btn-secondary">
              Back to Edit
            </button>
            <button className="brutal-btn brutal-btn-success">
              Confirm & Save
            </button>
            <button className="brutal-btn brutal-btn-danger">
              Delete Bill
            </button>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Click & hold to see the press animation — shadow collapses into surface.
          </p>
        </div>
      </section>

      {/* ── Inputs ──────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Inputs
        </h2>
        <div className="brutal-card-static p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Medicine Name
              </label>
              <input
                type="text"
                className="brutal-input"
                placeholder="e.g. Paracetamol 500mg"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Customer Name
              </label>
              <input
                type="text"
                className="brutal-input"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Quantity
              </label>
              <input
                type="number"
                className="brutal-input-data"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Cost / Piece (₹)
              </label>
              <input
                type="number"
                className="brutal-input-data"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Subtotal
              </label>
              <div className="brutal-input-data font-bold"
                style={{ background: "var(--bg-secondary)", cursor: "default" }}>
                ₹0.00
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-semibold mb-2">
                Error State
              </label>
              <input
                type="text"
                className="brutal-input brutal-input-error"
                placeholder="Required field"
              />
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Text inputs use Space Grotesk · Numeric inputs use JetBrains Mono with tabular figures.
          </p>
        </div>
      </section>

      {/* ── Payment Mode Chips ──────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Payment Mode Selection
        </h2>
        <div className="brutal-card-static p-6">
          <label className="block text-xs uppercase tracking-widest font-semibold mb-3">
            Select Payment Mode
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { key: "CASH", label: "₹ Cash", chipClass: "chip-cash" },
              { key: "CARD", label: "Card", chipClass: "chip-card" },
              { key: "PAYTM", label: "Paytm", chipClass: "chip-paytm" },
            ].map((pm) => (
              <button
                key={pm.key}
                className={`brutal-chip ${pm.chipClass} ${selectedPayment === pm.key ? "selected" : ""}`}
                onClick={() => setSelectedPayment(pm.key)}
              >
                {pm.label}
              </button>
            ))}
          </div>
          <p className="font-data text-sm" style={{ color: "var(--text-secondary)" }}>
            Selected: {selectedPayment ?? "None"}
          </p>
        </div>
      </section>

      {/* ── Toggle ──────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Toggles
        </h2>
        <div className="brutal-card-static p-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`brutal-toggle ${toggle1 ? "active" : ""}`}
                onClick={() => setToggle1(!toggle1)}
              />
              <span className="text-sm font-semibold uppercase">
                Doctor&apos;s Prescription
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`brutal-toggle ${toggle2 ? "active" : ""}`}
                onClick={() => setToggle2(!toggle2)}
              />
              <span className="text-sm font-semibold uppercase">
                Active (On)
              </span>
            </div>
          </div>
          {toggle1 && (
            <div className="brutal-badge"
              style={{ background: "var(--brutal-yellow)", color: "var(--brutal-black)", borderColor: "var(--brutal-black)" }}>
              + ₹350 Prescription Charge
            </div>
          )}
        </div>
      </section>

      {/* ── Badges ──────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Badges
        </h2>
        <div className="brutal-card-static p-6">
          <div className="flex flex-wrap gap-3">
            <span className="brutal-badge"
              style={{ background: "var(--brutal-green)", color: "#FFF", borderColor: "var(--brutal-green)" }}>
              Saved
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-red)", color: "#FFF", borderColor: "var(--brutal-red)" }}>
              Deleted
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-yellow)", color: "var(--brutal-black)", borderColor: "var(--brutal-black)" }}>
              Prescription
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-blue)", color: "#FFF", borderColor: "var(--brutal-blue)" }}>
              Admin
            </span>
            <span className="brutal-badge">
              Employee
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-cash)", color: "#FFF", borderColor: "var(--brutal-cash)" }}>
              Cash
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-card)", color: "#FFF", borderColor: "var(--brutal-card)" }}>
              Card
            </span>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-paytm)", color: "#FFF", borderColor: "var(--brutal-paytm)" }}>
              Paytm
            </span>
          </div>
        </div>
      </section>

      {/* ── Cards ───────────────────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Cards
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* KPI Card */}
          <div className="brutal-card p-6">
            <p className="text-xs uppercase tracking-widest font-semibold mb-1"
              style={{ color: "var(--text-secondary)" }}>
              Today&apos;s Revenue
            </p>
            <p className="font-data text-3xl font-bold"
              style={{ color: "var(--brutal-green)" }}>
              ₹24,580
            </p>
            <p className="font-data text-sm mt-1"
              style={{ color: "var(--text-muted)" }}>
              42 bills
            </p>
          </div>

          {/* Payment Stream Card */}
          <div className="brutal-card p-6">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3"
              style={{ color: "var(--text-secondary)" }}>
              Payment Stream
            </p>
            <div className="space-y-2">
              {[
                { label: "Cash", value: "₹12,400", color: "var(--brutal-cash)", pct: 50 },
                { label: "Card", value: "₹8,200", color: "var(--brutal-card)", pct: 33 },
                { label: "Paytm", value: "₹3,980", color: "var(--brutal-paytm)", pct: 17 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs font-semibold uppercase mb-1">
                    <span>{s.label}</span>
                    <span className="font-data">{s.value}</span>
                  </div>
                  <div className="h-3" style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border-hard)" }}>
                    <div className="h-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Card */}
          <div className="brutal-card p-6 cursor-pointer">
            <p className="text-xs uppercase tracking-widest font-semibold mb-1"
              style={{ color: "var(--text-secondary)" }}>
              Hover Me
            </p>
            <p className="text-lg font-bold mb-2">Interactive Card</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Cards have a hover effect — the shadow compresses as the card
              moves toward the surface, simulating a physical press.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sample Bill Preview ─────────────────────────── */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          Sample Bill Preview
        </h2>
        <div className="brutal-card-static p-6 max-w-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-data text-xs tracking-widest"
                style={{ color: "var(--text-secondary)" }}>
                BILL #
              </p>
              <p className="font-data text-lg font-bold">20250217-0042</p>
            </div>
            <span className="brutal-badge"
              style={{ background: "var(--brutal-cash)", color: "#FFF", borderColor: "var(--brutal-cash)" }}>
              Cash
            </span>
          </div>

          <div className="brutal-divider-soft mb-4" />

          {/* Line Items */}
          <div className="space-y-3 mb-4">
            {[
              { name: "Paracetamol 500mg", qty: 10, cost: 2.50, sub: 25.00 },
              { name: "Amoxicillin 250mg", qty: 3, cost: 18.00, sub: 54.00 },
              { name: "Cetirizine 10mg", qty: 5, cost: 4.00, sub: 20.00 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="font-data text-xs" style={{ color: "var(--text-secondary)" }}>
                    {item.qty} × ₹{item.cost.toFixed(2)}
                  </p>
                </div>
                <p className="font-data text-sm font-bold">₹{item.sub.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="brutal-divider-soft mb-3" />

          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: "var(--text-secondary)" }}>Medicines Subtotal</span>
            <span className="font-data font-semibold">₹99.00</span>
          </div>
          <div className="flex justify-between text-sm mb-3"
            style={{ color: "var(--brutal-yellow)" }}>
            <span className="font-semibold">Prescription Charge</span>
            <span className="font-data font-semibold">₹350.00</span>
          </div>

          <div className="brutal-divider mb-3" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold uppercase">Grand Total</span>
            <span className="font-data text-2xl font-bold"
              style={{ color: "var(--brutal-green)" }}>
              ₹449.00
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="brutal-divider pt-6 pb-12">
        <p className="font-data text-xs uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}>
          Pharmacy Sales Dashboard · Brutalist Design System · v1.0
        </p>
      </footer>
    </div>
  );
}
