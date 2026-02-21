import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PHARMACY_NAME } from "@/lib/constants";
import { sendEmailWithRetry } from "@/lib/email-retry";
import { getEmailConfig } from "@/lib/email-config";

/**
 * POST /api/reports/daily — Daily sales summary email.
 *
 * Triggered by a cron job (e.g., QStash, Vercel Cron) at 11 PM IST.
 * Requires CRON_SECRET env var for authentication.
 *
 * To enable email delivery, install `resend` and set RESEND_API_KEY + ADMIN_EMAIL env vars.
 * Until then, this endpoint aggregates data and returns the report payload as JSON.
 */
export async function POST(req: Request) {
    // Authenticate cron request
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get today's IST bounds
        const now = new Date();
        const todayStr = now.toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
        });
        const start = new Date(`${todayStr}T00:00:00.000+05:30`);
        const end = new Date(`${todayStr}T23:59:59.999+05:30`);

        // Aggregate today's data
        const [bills, aggregate] = await Promise.all([
            prisma.bill.findMany({
                where: { createdAt: { gte: start, lte: end }, isDeleted: false },
                include: {
                    user: { select: { fullName: true, username: true } },
                    lineItems: true,
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.bill.aggregate({
                where: { createdAt: { gte: start, lte: end }, isDeleted: false },
                _sum: { grandTotal: true, prescriptionCharge: true, medicinesSubtotal: true },
                _count: true,
            }),
        ]);

        const totalRevenue = Number(aggregate._sum.grandTotal || 0);
        const totalRx = Number(aggregate._sum.prescriptionCharge || 0);
        const totalMeds = Number(aggregate._sum.medicinesSubtotal || 0);
        const billCount = aggregate._count;

        // Payment mode breakdown
        const byPaymentMode: Record<string, { count: number; total: number }> = {};
        for (const bill of bills) {
            const mode = bill.paymentMode;
            if (!byPaymentMode[mode]) byPaymentMode[mode] = { count: 0, total: 0 };
            byPaymentMode[mode].count++;
            byPaymentMode[mode].total += Number(bill.grandTotal);
        }

        // Employee breakdown
        const byEmployee: Record<string, { name: string; count: number; total: number }> = {};
        for (const bill of bills) {
            const uid = bill.createdBy;
            if (!byEmployee[uid]) {
                byEmployee[uid] = { name: bill.user.fullName, count: 0, total: 0 };
            }
            byEmployee[uid].count++;
            byEmployee[uid].total += Number(bill.grandTotal);
        }

        // Top 5 medicines
        const medMap = new Map<string, number>();
        for (const bill of bills) {
            for (const li of bill.lineItems) {
                const key = li.medicineName.toLowerCase();
                medMap.set(key, (medMap.get(key) || 0) + li.quantity);
            }
        }
        const topMeds = [...medMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, qty]) => ({ name, quantity: qty }));

        const report = {
            type: "daily_summary",
            date: todayStr,
            pharmacy: PHARMACY_NAME,
            summary: {
                totalRevenue,
                totalMedicinesRevenue: totalMeds,
                totalPrescriptionRevenue: totalRx,
                billCount,
            },
            byPaymentMode,
            byEmployee: Object.values(byEmployee),
            topMedicines: topMeds,
        };

        // Email delivery via Resend (DB config → env var fallback)
        const emailConfig = await getEmailConfig();
        const resendKey = emailConfig.resendApiKey;
        const adminEmail = emailConfig.adminEmail;

        if (resendKey && adminEmail) {
            const formatCurrency = (n: number) =>
                `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

            const htmlBody = `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #111827;">📊 Daily Sales Summary — ${todayStr}</h2>
            <div style="background: #f9fafb; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <p style="margin:0;"><strong>Total Revenue:</strong> ${formatCurrency(totalRevenue)}</p>
              <p style="margin:0;"><strong>Bills:</strong> ${billCount}</p>
              <p style="margin:0;"><strong>Medicines:</strong> ${formatCurrency(totalMeds)}</p>
              <p style="margin:0;"><strong>Prescriptions:</strong> ${formatCurrency(totalRx)}</p>
            </div>
            <h3>Payment Breakdown</h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              ${Object.entries(byPaymentMode)
                    .map(
                        ([mode, d]) =>
                            `<tr><td style="padding:4px 8px;">${mode}</td><td>${d.count} bills</td><td style="text-align:right;">${formatCurrency(d.total)}</td></tr>`
                    )
                    .join("")}
            </table>
            <h3>Top Medicines</h3>
            <ol style="font-size:14px;">
              ${topMeds.map((m) => `<li>${m.name} — ${m.quantity} units</li>`).join("")}
            </ol>
            <p style="color:#6b7280; font-size:12px; margin-top:2rem;">
              ${PHARMACY_NAME} — Automated Daily Report
            </p>
          </div>
        `;

            const fromEmail = emailConfig.fromEmail;

            const result = await sendEmailWithRetry(resendKey, {
                from: `${PHARMACY_NAME} <${fromEmail}>`,
                to: adminEmail,
                subject: `📊 Daily Sales: ${formatCurrency(totalRevenue)} — ${todayStr}`,
                html: htmlBody,
            });

            return NextResponse.json({
                success: true,
                emailSent: result.sent,
                emailAttempts: result.attempts,
                ...(result.error && { emailError: result.error }),
                report,
            });
        }

        // No email configured — just return the report
        return NextResponse.json({
            success: true,
            emailSent: false,
            note: "Set RESEND_API_KEY and ADMIN_EMAIL to enable email delivery",
            report,
        });
    } catch (error) {
        console.error("Daily report error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
