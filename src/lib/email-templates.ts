/**
 * Shared email template helpers — Groww Digest-inspired design.
 *
 * Centered layout, branded header, clean horizontal-border tables,
 * green accent color, no emojis, professional and minimal.
 */

import { PHARMACY_NAME } from "@/lib/constants";

/* ── Palette ──────────────────────────────────────────────────── */

const COLOR = {
    text: "#111827",
    muted: "#6B7280",
    light: "#9CA3AF",
    border: "#E5E7EB",
    bgSubtle: "#F9FAFB",
    green: "#00B386",
    greenBg: "#E8F5E9",
    white: "#FFFFFF",
} as const;

const FONT =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/* ── Currency formatter ───────────────────────────────────────── */

export function fmt(n: number): string {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

/* ── Template wrapper ─────────────────────────────────────────── */

export function wrapEmailTemplate(
    subtitle: string,
    date: string,
    bodyHtml: string
): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:${COLOR.bgSubtle}; font-family:${FONT}; color:${COLOR.text}; -webkit-text-size-adjust:100%;">
  <div style="max-width:600px; margin:0 auto; background:${COLOR.white};">

    <!-- Header -->
    <div style="text-align:center; padding:36px 24px 8px;">
      <h1 style="margin:0; font-size:22px; font-weight:700; color:${COLOR.text}; letter-spacing:-0.3px;">
        Pharmacy <span style="background:${COLOR.greenBg}; padding:2px 10px; border-radius:4px; color:${COLOR.green};">Sales</span> Digest
      </h1>
    </div>

    <!-- Subtitle + Date -->
    <div style="text-align:center; padding:4px 24px 24px;">
      <p style="margin:0 0 2px; font-size:14px; font-weight:600; color:${COLOR.muted};">${subtitle}</p>
      <p style="margin:0; font-size:13px; color:${COLOR.light};">${date}</p>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid ${COLOR.border}; margin:0 24px;"></div>

    <!-- Body -->
    <div style="padding:24px;">
      ${bodyHtml}
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid ${COLOR.border}; margin:0 24px;"></div>
    <div style="text-align:center; padding:20px 24px 28px;">
      <p style="margin:0; font-size:12px; color:${COLOR.light};">
        ${PHARMACY_NAME}
      </p>
    </div>

  </div>
</body>
</html>`.trim();
}

/* ── Hero metrics row ─────────────────────────────────────────── */

export function buildMetricRow(
    metrics: { label: string; value: string }[]
): string {
    const cellWidth = Math.floor(100 / metrics.length);
    const cells = metrics
        .map(
            (m) => `
      <td style="width:${cellWidth}%; text-align:center; padding:16px 8px;">
        <div style="font-size:22px; font-weight:700; color:${COLOR.text}; letter-spacing:-0.3px;">${m.value}</div>
        <div style="font-size:11px; font-weight:600; color:${COLOR.muted}; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px;">${m.label}</div>
      </td>`
        )
        .join("");

    return `
    <table style="width:100%; border-collapse:collapse; background:${COLOR.bgSubtle}; border-radius:8px; margin-bottom:28px;">
      <tr>${cells}</tr>
    </table>`;
}

/* ── Section header ───────────────────────────────────────────── */

export function buildSectionHeader(title: string): string {
    return `<h3 style="margin:28px 0 12px; font-size:11px; font-weight:700; color:${COLOR.muted}; text-transform:uppercase; letter-spacing:1px;">${title}</h3>`;
}

/* ── Data table ───────────────────────────────────────────────── */

export function buildTable(
    headers: string[],
    rows: string[][],
    alignRight: number[] = []
): string {
    const thCells = headers
        .map(
            (h, i) =>
                `<th style="padding:10px 12px; text-align:${alignRight.includes(i) ? "right" : "left"}; font-size:11px; font-weight:700; color:${COLOR.muted}; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid ${COLOR.border};">${h}</th>`
        )
        .join("");

    const bodyRows = rows
        .map(
            (row) =>
                `<tr>${row
                    .map(
                        (cell, i) =>
                            `<td style="padding:10px 12px; font-size:14px; color:${COLOR.text}; border-bottom:1px solid ${COLOR.border}; text-align:${alignRight.includes(i) ? "right" : "left"};">${cell}</td>`
                    )
                    .join("")}</tr>`
        )
        .join("");

    return `
    <table style="width:100%; border-collapse:collapse;">
      <thead><tr>${thCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
}

/* ── Restock alert table ──────────────────────────────────────── */

export function buildRestockAlert(
    items: { id: string; name: string; category: string | null; currentStock: number; reorderLevel: number }[]
): string {
    const rows = items.map((item) => {
        const stockColor = item.currentStock === 0 ? "#DC2626" : "#D97706";
        return `
      <tr>
        <td style="padding:10px 12px; font-size:14px; color:${COLOR.text}; border-bottom:1px solid ${COLOR.border}; font-weight:500;">${item.name}</td>
        <td style="padding:10px 12px; font-size:14px; color:${COLOR.muted}; border-bottom:1px solid ${COLOR.border};">${item.category || "—"}</td>
        <td style="padding:10px 12px; font-size:14px; color:${stockColor}; border-bottom:1px solid ${COLOR.border}; text-align:right; font-weight:600;">${item.currentStock}</td>
        <td style="padding:10px 12px; font-size:14px; color:${COLOR.muted}; border-bottom:1px solid ${COLOR.border}; text-align:right;">${item.reorderLevel}</td>
      </tr>`;
    }).join("");

    const thStyle = `padding:10px 12px; text-align:left; font-size:11px; font-weight:700; color:${COLOR.muted}; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid ${COLOR.border};`;

    return `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th style="${thStyle}">Medicine</th>
          <th style="${thStyle}">Category</th>
          <th style="${thStyle} text-align:right;">Current Stock</th>
          <th style="${thStyle} text-align:right;">Reorder Level</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── Ranked list (top medicines) ──────────────────────────────── */

export function buildRankedList(
    items: { name: string; value: string }[]
): string {
    const rows = items
        .map(
            (item, i) => `
      <tr>
        <td style="padding:8px 12px; font-size:14px; color:${COLOR.light}; width:28px; border-bottom:1px solid ${COLOR.border};">${i + 1}.</td>
        <td style="padding:8px 12px; font-size:14px; color:${COLOR.text}; border-bottom:1px solid ${COLOR.border};">${item.name}</td>
        <td style="padding:8px 12px; font-size:14px; color:${COLOR.text}; text-align:right; border-bottom:1px solid ${COLOR.border}; font-weight:600;">${item.value}</td>
      </tr>`
        )
        .join("");

    return `
    <table style="width:100%; border-collapse:collapse;">
      <tbody>${rows}</tbody>
    </table>`;
}
