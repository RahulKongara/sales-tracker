import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validators/bill";
import { PRESCRIPTION_CHARGE } from "@/lib/constants";
import { getISTDayBounds } from "@/lib/utils";

/**
 * POST /api/bills — Create a new bill.
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = billSchema.parse(body);

        // Calculate totals
        const lineItems = parsed.lineItems.map((item, index) => ({
            medicineName: item.medicineName,
            quantity: item.quantity,
            costPerPiece: item.costPerPiece,
            subtotal: item.quantity * item.costPerPiece,
            sortOrder: index,
        }));

        const medicinesSubtotal = lineItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );
        const prescriptionCharge = parsed.hasPrescription
            ? PRESCRIPTION_CHARGE
            : 0;
        const grandTotal = medicinesSubtotal + prescriptionCharge;

        // Generate bill number: YYYYMMDD-NNNN
        const { start, end } = getISTDayBounds();
        const todayBillCount = await prisma.bill.count({
            where: {
                createdAt: { gte: start, lte: end },
                isDeleted: false,
            },
        });

        const now = new Date();
        const istDateStr = now.toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
        });
        const [yyyy, mm, dd] = istDateStr.split("-");
        const seq = String(todayBillCount + 1).padStart(4, "0");
        const billNumber = `${yyyy}${mm}${dd}-${seq}`;

        // Create bill + line items in a transaction
        const bill = await prisma.bill.create({
            data: {
                billNumber,
                createdBy: session.user.id,
                customerName: parsed.customerName || null,
                paymentMode: parsed.paymentMode,
                hasPrescription: parsed.hasPrescription,
                prescriptionCharge,
                medicinesSubtotal,
                grandTotal,
                lineItems: {
                    create: lineItems,
                },
            },
            include: {
                lineItems: true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                bill: {
                    id: bill.id,
                    billNumber: bill.billNumber,
                    grandTotal: Number(bill.grandTotal),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Invalid bill data", details: error },
                { status: 400 }
            );
        }
        console.error("Bill creation error:", error);
        return NextResponse.json(
            { error: "Failed to create bill" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/bills — List today's bills for the current user.
 */
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { start, end } = getISTDayBounds();

        const bills = await prisma.bill.findMany({
            where: {
                createdBy: session.user.id,
                createdAt: { gte: start, lte: end },
                isDeleted: false,
            },
            include: {
                _count: { select: { lineItems: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
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
            })),
        });
    } catch (error) {
        console.error("Bill listing error:", error);
        return NextResponse.json(
            { error: "Failed to fetch bills" },
            { status: 500 }
        );
    }
}
