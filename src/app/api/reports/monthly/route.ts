import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PHARMACY_NAME } from "@/lib/constants";
import { sendEmailWithRetry } from "@/lib/email-retry";
import { getEmailConfig } from "@/lib/email-config";
import { toIST } from "@/lib/utils";
import {
    fmt,
    wrapEmailTemplate,
    buildMetricRow,
    buildSectionHeader,
    buildTable,
    buildRankedList,
} from "@/lib/email-templates";

/**
 * POST /api/reports/monthly — Monthly sales report email.
 *
 * Triggered by a cron job on the last day of each month at 11 PM IST.
 * Requires CRON_SECRET env var for authentication.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const IST_OFFSET_MS = 330 * 60 * 1000;
        const istNow = new Date(now.getTime() + IST_OFFSET_MS);
        const year = istNow.getUTCFullYear();
        const month = istNow.getUTCMonth() + 1;

        const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000+05:30`);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const end = new Date(
            `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000+05:30`
        );

        const monthLabel = now.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            month: "long",
            year: "numeric",
        });

        // Aggregate monthly data
        const [bills, aggregate] = await Promise.all([
            prisma.bill.findMany({
                where: { createdAt: { gte: start, lt: end }, isDeleted: false },
                include: {
                    user: { select: { fullName: true, username: true } },
                    lineItems: true,
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.bill.aggregate({
                where: { createdAt: { gte: start, lt: end }, isDeleted: false },
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

        // Top 10 medicines
        const medMap = new Map<string, number>();
        for (const bill of bills) {
            for (const li of bill.lineItems) {
                const key = li.medicineName.toLowerCase();
                medMap.set(key, (medMap.get(key) || 0) + li.quantity);
            }
        }
        const topMeds = [...medMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, qty]) => ({ name, quantity: qty }));

        // Weekly breakdown
        const weeklyData: Record<string, { revenue: number; count: number }> = {};
        for (const bill of bills) {
            const billDate = new Date(bill.createdAt);
            const istBillDate = toIST(billDate);
            const dayOfMonth = istBillDate.getUTCDate();
            const weekNum = Math.ceil(dayOfMonth / 7);
            const weekKey = `Week ${weekNum}`;
            if (!weeklyData[weekKey]) weeklyData[weekKey] = { revenue: 0, count: 0 };
            weeklyData[weekKey].revenue += Number(bill.grandTotal);
            weeklyData[weekKey].count++;
        }

        const report = {
            type: "monthly_report",
            month: monthLabel,
            pharmacy: PHARMACY_NAME,
            summary: {
                totalRevenue,
                totalMedicinesRevenue: totalMeds,
                totalPrescriptionRevenue: totalRx,
                billCount,
                avgBillValue: billCount > 0 ? totalRevenue / billCount : 0,
            },
            byPaymentMode,
            byEmployee: Object.values(byEmployee).sort((a, b) => b.total - a.total),
            topMedicines: topMeds,
            weeklyBreakdown: weeklyData,
        };

        // Email delivery
        const emailConfig = await getEmailConfig();
        const resendKey = emailConfig.resendApiKey;
        const adminEmail = emailConfig.adminEmail;

        if (resendKey && adminEmail) {
            const bodyHtml = [
                buildMetricRow([
                    { label: "Total Revenue", value: fmt(totalRevenue) },
                    { label: "Bills", value: String(billCount) },
                    { label: "Avg Bill", value: fmt(report.summary.avgBillValue) },
                ]),
                buildSectionHeader("Weekly Breakdown"),
                buildTable(
                    ["Week", "Revenue", "Bills"],
                    Object.entries(weeklyData).map(([week, d]) => [
                        week,
                        fmt(d.revenue),
                        String(d.count),
                    ]),
                    [1]
                ),
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
                buildSectionHeader("Employee Performance"),
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

            const htmlBody = wrapEmailTemplate("Monthly", monthLabel, bodyHtml);

            const result = await sendEmailWithRetry(resendKey, {
                from: `${PHARMACY_NAME} <${emailConfig.fromEmail}>`,
                to: adminEmail,
                subject: `Monthly Report: ${fmt(totalRevenue)} — ${monthLabel}`,
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
        console.error("Monthly report error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
