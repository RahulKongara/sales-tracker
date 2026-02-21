import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getISTDayBounds } from "@/lib/utils";

/**
 * GET /api/admin/stats?date=YYYY-MM-DD
 * Returns sales summary for a given date (defaults to today IST).
 * Includes: total revenue, bill count, payment mode breakdown,
 * prescription summary, and list of bills.
 */
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Accept optional date param (YYYY-MM-DD), default to today IST
        const dateParam = req.nextUrl.searchParams.get("date");
        const { start, end } = dateParam
            ? {
                start: new Date(`${dateParam}T00:00:00.000+05:30`),
                end: new Date(`${dateParam}T23:59:59.999+05:30`),
            }
            : getISTDayBounds();

        const where = {
            createdAt: { gte: start, lte: end },
            isDeleted: false,
        };

        // Bills with creator info
        const bills = await prisma.bill.findMany({
            where,
            include: {
                user: { select: { username: true, fullName: true } },
                _count: { select: { lineItems: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Aggregate
        const totals = bills.reduce(
            (acc, bill) => {
                const gt = Number(bill.grandTotal);
                const rx = Number(bill.prescriptionCharge);
                acc.totalRevenue += gt;
                acc.billCount += 1;
                acc.byPaymentMode[bill.paymentMode] =
                    (acc.byPaymentMode[bill.paymentMode] || 0) + gt;
                acc.billCountByMode[bill.paymentMode] =
                    (acc.billCountByMode[bill.paymentMode] || 0) + 1;

                // Prescription summary
                if (bill.hasPrescription) {
                    acc.prescriptionCount += 1;
                    acc.totalPrescriptionCharges += rx;
                } else {
                    acc.nonPrescriptionCount += 1;
                }

                return acc;
            },
            {
                totalRevenue: 0,
                billCount: 0,
                byPaymentMode: {} as Record<string, number>,
                billCountByMode: {} as Record<string, number>,
                prescriptionCount: 0,
                nonPrescriptionCount: 0,
                totalPrescriptionCharges: 0,
            }
        );

        return NextResponse.json({
            ...totals,
            date: dateParam || start.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
            bills: bills.map((b) => ({
                id: b.id,
                billNumber: b.billNumber,
                createdAt: b.createdAt.toISOString(),
                customerName: b.customerName,
                paymentMode: b.paymentMode,
                hasPrescription: b.hasPrescription,
                prescriptionCharge: Number(b.prescriptionCharge),
                medicinesSubtotal: Number(b.medicinesSubtotal),
                grandTotal: Number(b.grandTotal),
                itemCount: b._count.lineItems,
                createdByName: b.user.fullName,
                createdByUser: b.user.username,
            })),
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
