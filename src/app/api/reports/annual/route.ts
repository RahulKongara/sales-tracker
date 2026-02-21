import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PHARMACY_NAME } from "@/lib/constants";
import { sendEmailWithRetry } from "@/lib/email-retry";
import { getEmailConfig } from "@/lib/email-config";

/**
 * GET /api/reports/annual?year=2025
 * POST /api/reports/annual  (cron/manual trigger)
 *
 * Annual summary report — aggregates full-year stats.
 * GET: returns JSON report for any year (admin auth via session).
 * POST: triggers email delivery (cron auth via CRON_SECRET).
 */

// ── Shared aggregation ──────────────────────────────────────────

async function buildAnnualReport(year: number) {
    const start = new Date(`${year}-01-01T00:00:00.000+05:30`);
    const end = new Date(`${year}-12-31T23:59:59.999+05:30`);

    const where = { createdAt: { gte: start, lte: end }, isDeleted: false };

    const [aggregate, byMonth, byPayment, byEmployee] = await Promise.all([
        // Overall totals
        prisma.bill.aggregate({
            where,
            _sum: {
                grandTotal: true,
                prescriptionCharge: true,
                medicinesSubtotal: true,
            },
            _count: true,
        }),

        // Monthly breakdown (groupBy)
        prisma.$queryRaw<
            { month: number; count: bigint; total: number }[]
        >`
      SELECT
        EXTRACT(MONTH FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS month,
        COUNT(*)::bigint AS count,
        COALESCE(SUM(grand_total), 0)::float AS total
      FROM bills
      WHERE created_at >= ${start}
        AND created_at <= ${end}
        AND is_deleted = false
      GROUP BY month
      ORDER BY month
    `,

        // By payment mode
        prisma.bill.groupBy({
            by: ["paymentMode"],
            where,
            _count: true,
            _sum: { grandTotal: true },
        }),

        // By employee
        prisma.bill.groupBy({
            by: ["createdBy"],
            where,
            _count: true,
            _sum: { grandTotal: true },
        }),
    ]);

    // Fetch employee names
    const empIds = byEmployee.map((e) => e.createdBy);
    const users = await prisma.user.findMany({
        where: { id: { in: empIds } },
        select: { id: true, fullName: true, username: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Top medicines
    const topMeds = await prisma.$queryRaw<
        { name: string; quantity: bigint }[]
    >`
    SELECT
      bli.medicine_name AS name,
      SUM(bli.quantity)::bigint AS quantity
    FROM bill_line_items bli
    JOIN bills b ON b.id = bli.bill_id
    WHERE b.created_at >= ${start}
      AND b.created_at <= ${end}
      AND b.is_deleted = false
    GROUP BY bli.medicine_name
    ORDER BY quantity DESC
    LIMIT 10
  `;

    const totalRevenue = Number(aggregate._sum.grandTotal || 0);
    const totalMeds = Number(aggregate._sum.medicinesSubtotal || 0);
    const totalRx = Number(aggregate._sum.prescriptionCharge || 0);
    const billCount = aggregate._count;

    return {
        type: "annual_summary",
        year,
        pharmacy: PHARMACY_NAME,
        summary: {
            totalRevenue,
            totalMedicinesRevenue: totalMeds,
            totalPrescriptionRevenue: totalRx,
            billCount,
            avgBillValue: billCount > 0 ? +(totalRevenue / billCount).toFixed(2) : 0,
        },
        monthlyBreakdown: byMonth.map((m) => ({
            month: m.month,
            billCount: Number(m.count),
            revenue: m.total,
        })),
        byPaymentMode: byPayment.map((p) => ({
            mode: p.paymentMode,
            count: p._count,
            total: Number(p._sum.grandTotal || 0),
        })),
        byEmployee: byEmployee.map((e) => {
            const u = userMap.get(e.createdBy);
            return {
                name: u?.fullName || "Unknown",
                username: u?.username || "",
                count: e._count,
                total: Number(e._sum.grandTotal || 0),
            };
        }),
        topMedicines: topMeds.map((m) => ({
            name: m.name,
            quantity: Number(m.quantity),
        })),
    };
}

// ── GET: Query annual report (admin) ────────────────────────────

export async function GET(req: NextRequest) {
    // Import auth dynamically for the admin check
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const yearParam = req.nextUrl.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
        return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    try {
        const report = await buildAnnualReport(year);
        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error("Annual report error:", error);
        return NextResponse.json(
            { error: "Failed to generate annual report" },
            { status: 500 }
        );
    }
}

// ── POST: Cron trigger with email ───────────────────────────────

export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const year = new Date().getFullYear() - 1; // Report for previous year
        const report = await buildAnnualReport(year);

        const formatCurrency = (n: number) =>
            `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

        // Email delivery (DB config → env var fallback)
        const emailConfig = await getEmailConfig();
        const resendKey = emailConfig.resendApiKey;
        const adminEmail = emailConfig.adminEmail;

        if (resendKey && adminEmail) {
            const monthNames = [
                "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];

            const htmlBody = `
        <div style="font-family: -apple-system, sans-serif; max-width: 640px; margin: 0 auto;">
          <h2 style="color: #111827;">📊 Annual Sales Summary — ${year}</h2>
          <div style="background: #f9fafb; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p style="margin:0;"><strong>Total Revenue:</strong> ${formatCurrency(report.summary.totalRevenue)}</p>
            <p style="margin:0;"><strong>Total Bills:</strong> ${report.summary.billCount}</p>
            <p style="margin:0;"><strong>Avg Bill Value:</strong> ${formatCurrency(report.summary.avgBillValue)}</p>
            <p style="margin:0;"><strong>Medicines:</strong> ${formatCurrency(report.summary.totalMedicinesRevenue)}</p>
            <p style="margin:0;"><strong>Prescriptions:</strong> ${formatCurrency(report.summary.totalPrescriptionRevenue)}</p>
          </div>
          <h3>Monthly Breakdown</h3>
          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr style="background:#f3f4f6;"><th style="padding:6px 8px; text-align:left;">Month</th><th>Bills</th><th style="text-align:right;">Revenue</th></tr>
            ${report.monthlyBreakdown
                    .map(
                        (m) =>
                            `<tr><td style="padding:4px 8px;">${monthNames[m.month]}</td><td>${m.billCount}</td><td style="text-align:right;">${formatCurrency(m.revenue)}</td></tr>`
                    )
                    .join("")}
          </table>
          <h3>Top 10 Medicines</h3>
          <ol style="font-size:14px;">
            ${report.topMedicines.map((m) => `<li>${m.name} — ${m.quantity} units</li>`).join("")}
          </ol>
          <p style="color:#6b7280; font-size:12px; margin-top:2rem;">
            ${PHARMACY_NAME} — Automated Annual Report
          </p>
        </div>
      `;

            const fromEmail = emailConfig.fromEmail;

            const result = await sendEmailWithRetry(resendKey, {
                from: `${PHARMACY_NAME} <${fromEmail}>`,
                to: adminEmail,
                subject: `📊 Annual Report ${year}: ${formatCurrency(report.summary.totalRevenue)}`,
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
        console.error("Annual report error:", error);
        return NextResponse.json(
            { error: "Failed to generate annual report" },
            { status: 500 }
        );
    }
}
