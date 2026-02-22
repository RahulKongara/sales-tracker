import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISTDateParam, getISTDayBounds, toISTDateString } from "@/lib/utils";

/**
 * GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns aggregated sales data for the given date range.
 */
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = req.nextUrl;
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");

        // Default: last 7 days
        const parsedTo = parseISTDateParam(toParam);
        const parsedFrom = parseISTDateParam(fromParam);

        const to = parsedTo?.end ?? getISTDayBounds().end;
        const from = parsedFrom?.start ?? new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);

        const where = {
            createdAt: { gte: from, lte: to },
            isDeleted: false,
        };

        // All bills in range
        const bills = await prisma.bill.findMany({
            where,
            include: {
                user: { select: { username: true, fullName: true } },
                _count: { select: { lineItems: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // ── Aggregations ──────────────────────────────────────
        let totalRevenue = 0;
        let totalPrescriptionRevenue = 0;
        let totalMedicinesRevenue = 0;
        const byPaymentMode: Record<string, { count: number; total: number }> = {};
        const byDay: Record<
            string,
            { date: string; revenue: number; count: number }
        > = {};
        const byEmployee: Record<
            string,
            { name: string; username: string; count: number; total: number }
        > = {};
        const medicineFrequency: Record<string, number> = {};

        for (const bill of bills) {
            const gt = Number(bill.grandTotal);
            const rx = Number(bill.prescriptionCharge);
            const med = Number(bill.medicinesSubtotal);

            totalRevenue += gt;
            totalPrescriptionRevenue += rx;
            totalMedicinesRevenue += med;

            // By payment mode
            const mode = bill.paymentMode;
            if (!byPaymentMode[mode]) byPaymentMode[mode] = { count: 0, total: 0 };
            byPaymentMode[mode].count += 1;
            byPaymentMode[mode].total += gt;

            // By day (IST)
            const dayStr = toISTDateString(bill.createdAt);
            if (!byDay[dayStr])
                byDay[dayStr] = { date: dayStr, revenue: 0, count: 0 };
            byDay[dayStr].revenue += gt;
            byDay[dayStr].count += 1;

            // By employee
            const uid = bill.createdBy;
            if (!byEmployee[uid])
                byEmployee[uid] = {
                    name: bill.user.fullName,
                    username: bill.user.username,
                    count: 0,
                    total: 0,
                };
            byEmployee[uid].count += 1;
            byEmployee[uid].total += gt;
        }

        // Top medicines (need line items)
        const lineItems = await prisma.billLineItem.findMany({
            where: {
                bill: where,
            },
            select: { medicineName: true, quantity: true },
        });

        for (const li of lineItems) {
            const name = li.medicineName.toLowerCase().trim();
            medicineFrequency[name] = (medicineFrequency[name] || 0) + li.quantity;
        }

        const topMedicines = Object.entries(medicineFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, qty]) => ({ name, totalQuantity: qty }));

        // Daily data sorted by date
        const dailyData = Object.values(byDay).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return NextResponse.json({
            dateRange: {
                from: from.toISOString(),
                to: to.toISOString(),
            },
            summary: {
                totalRevenue,
                totalPrescriptionRevenue,
                totalMedicinesRevenue,
                billCount: bills.length,
                avgBillValue: bills.length > 0 ? totalRevenue / bills.length : 0,
            },
            byPaymentMode,
            dailyData,
            byEmployee: Object.values(byEmployee).sort(
                (a, b) => b.total - a.total
            ),
            topMedicines,
            recentBills: bills.slice(0, 20).map((b) => ({
                id: b.id,
                billNumber: b.billNumber,
                createdAt: b.createdAt.toISOString(),
                customerName: b.customerName,
                paymentMode: b.paymentMode,
                grandTotal: Number(b.grandTotal),
                itemCount: b._count.lineItems,
                createdByName: b.user.fullName,
            })),
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
