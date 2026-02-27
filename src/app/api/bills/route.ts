import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billSchema } from "@/lib/validators/bill";
import { PRESCRIPTION_CHARGE } from "@/lib/constants";
import { getISTDayBounds, toISTDateString } from "@/lib/utils";
import { deductStock } from "@/lib/stock";

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
            medicineId: item.medicineId || null,
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
        // Retries on unique conflict (race condition between concurrent requests)
        const now = new Date();
        const istDateStr = toISTDateString(now);
        const [yyyy, mm, dd] = istDateStr.split("-");

        let bill;
        let stockWarnings: string[] = [];
        let attempts = 0;
        while (true) {
            const { start, end } = getISTDayBounds();
            const todayBillCount = await prisma.bill.count({
                where: {
                    createdAt: { gte: start, lte: end },
                    isDeleted: false,
                },
            });

            const seq = String(todayBillCount + 1 + attempts).padStart(4, "0");
            const billNumber = `${yyyy}${mm}${dd}-${seq}`;

            try {
                const result = await prisma.$transaction(async (tx) => {
                    const createdBill = await tx.bill.create({
                        data: {
                            billNumber,
                            createdBy: session.user!.id,
                            customerName: parsed.customerName || null,
                            paymentMode: parsed.paymentMode,
                            hasPrescription: parsed.hasPrescription,
                            prescriptionCharge,
                            medicinesSubtotal,
                            grandTotal,
                            lineItems: {
                                create: lineItems.map((li) => ({
                                    medicineName: li.medicineName,
                                    quantity: li.quantity,
                                    costPerPiece: li.costPerPiece,
                                    subtotal: li.subtotal,
                                    sortOrder: li.sortOrder,
                                    medicineId: li.medicineId,
                                })),
                            },
                        },
                        include: {
                            lineItems: true,
                        },
                    });

                    // Deduct stock for line items with a catalogued medicine
                    const warnings: string[] = [];
                    for (let i = 0; i < lineItems.length; i++) {
                        const li = lineItems[i];
                        if (li.medicineId) {
                            const lineItemId = createdBill.lineItems.find(
                                (cli) => cli.sortOrder === li.sortOrder
                            )?.id;
                            if (lineItemId) {
                                const { insufficient } = await deductStock(
                                    tx,
                                    li.medicineId,
                                    li.quantity,
                                    lineItemId
                                );
                                if (insufficient) {
                                    warnings.push(li.medicineName);
                                }
                            }
                        }
                    }

                    return { bill: createdBill, warnings };
                });

                bill = result.bill;
                stockWarnings = result.warnings;
                break;
            } catch (err: unknown) {
                if (
                    err instanceof Error &&
                    "code" in err &&
                    (err as { code: string }).code === "P2002" &&
                    attempts < 5
                ) {
                    attempts++;
                    continue;
                }
                throw err;
            }
        }

        return NextResponse.json(
            {
                success: true,
                bill: {
                    id: bill.id,
                    billNumber: bill.billNumber,
                    grandTotal: Number(bill.grandTotal),
                },
                ...(stockWarnings.length > 0 && { stockWarnings }),
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
