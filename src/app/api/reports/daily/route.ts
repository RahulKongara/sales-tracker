import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";
import { PHARMACY_NAME } from "@/lib/constants";
import { sendEmailWithRetry } from "@/lib/email-retry";
import { getEmailConfig } from "@/lib/email-config";
import { getISTDayBounds, toISTDateString } from "@/lib/utils";
import {
    fmt,
    wrapEmailTemplate,
    buildMetricRow,
    buildSectionHeader,
    buildTable,
    buildRankedList,
} from "@/lib/email-templates";

/**
 * POST /api/reports/daily — Daily sales summary email.
 *
 * Triggered by QStash schedule at 11:00 PM IST every day.
 * Authenticated via QStash signature verification (Upstash-Signature header).
 *
 * QStash cron: CRON_TZ=Asia/Kolkata 0 23 * * *
 */
async function handler(req: Request) {
    try {
        const now = new Date();
        const todayStr = toISTDateString(now);
        const { start, end } = getISTDayBounds(now);

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
            summary: { totalRevenue, totalMedicinesRevenue: totalMeds, totalPrescriptionRevenue: totalRx, billCount },
            byPaymentMode,
            byEmployee: Object.values(byEmployee),
            topMedicines: topMeds,
        };

        // Email delivery
        const emailConfig = await getEmailConfig();
        const resendKey = emailConfig.resendApiKey;
        const adminEmail = emailConfig.adminEmail;

        if (resendKey && adminEmail) {
            const dateDisplay = now.toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            const bodyHtml = [
                buildMetricRow([
                    { label: "Total Revenue", value: fmt(totalRevenue) },
                    { label: "Bills Created", value: String(billCount) },
                ]),
                buildSectionHeader("Payment Breakdown"),
                buildTable(
                    ["Mode", "Bills", "Amount"],
                    Object.entries(byPaymentMode).map(([mode, d]) => [
                        mode,
                        String(d.count),
                        fmt(d.total),
                    ]),
                    [2]
                ),
                buildSectionHeader("Employee Summary"),
                buildTable(
                    ["Name", "Bills", "Revenue"],
                    Object.values(byEmployee)
                        .sort((a, b) => b.total - a.total)
                        .map((e) => [e.name, String(e.count), fmt(e.total)]),
                    [2]
                ),
                buildSectionHeader("Top Medicines"),
                buildRankedList(
                    topMeds.map((m) => ({ name: m.name, value: `${m.quantity} units` }))
                ),
            ].join("");

            const htmlBody = wrapEmailTemplate("Daily", dateDisplay, bodyHtml);

            const result = await sendEmailWithRetry(resendKey, {
                from: `${PHARMACY_NAME} <${emailConfig.fromEmail}>`,
                to: adminEmail,
                subject: `Daily Sales: ${fmt(totalRevenue)} — ${todayStr}`,
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

export const POST = verifySignatureAppRouter(handler);
