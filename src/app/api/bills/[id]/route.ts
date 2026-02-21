import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRESCRIPTION_CHARGE } from "@/lib/constants";

interface PatchLineItem {
    medicineName: string;
    quantity: number;
    costPerPiece: number;
}

/**
 * PATCH /api/bills/:id — Admin edits a saved bill.
 * Creates an AuditLog entry with the previous state before applying changes.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { lineItems, paymentMode, hasPrescription, customerName, notes } =
            body as {
                lineItems?: PatchLineItem[];
                paymentMode?: "CASH" | "CARD" | "PAYTM";
                hasPrescription?: boolean;
                customerName?: string | null;
                notes?: string;
            };

        // Fetch current bill for snapshot
        const current = await prisma.bill.findUnique({
            where: { id, isDeleted: false },
            include: { lineItems: { orderBy: { sortOrder: "asc" } } },
        });

        if (!current) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        // Snapshot previous state
        const previousState = {
            paymentMode: current.paymentMode,
            hasPrescription: current.hasPrescription,
            customerName: current.customerName,
            prescriptionCharge: Number(current.prescriptionCharge),
            medicinesSubtotal: Number(current.medicinesSubtotal),
            grandTotal: Number(current.grandTotal),
            lineItems: current.lineItems.map((li) => ({
                medicineName: li.medicineName,
                quantity: li.quantity,
                costPerPiece: Number(li.costPerPiece),
                subtotal: Number(li.subtotal),
            })),
        };

        // Calculate new totals
        const newHasRx = hasPrescription ?? current.hasPrescription;
        const rxCharge = newHasRx ? PRESCRIPTION_CHARGE : 0;

        let medicinesSubtotal = Number(current.medicinesSubtotal);
        if (lineItems && lineItems.length > 0) {
            medicinesSubtotal = lineItems.reduce(
                (sum, li) => sum + li.quantity * li.costPerPiece,
                0
            );
        }

        const grandTotal = medicinesSubtotal + rxCharge;

        // Apply edits in a transaction
        const updated = await prisma.$transaction(async (tx) => {
            // Update bill fields
            const bill = await tx.bill.update({
                where: { id },
                data: {
                    ...(paymentMode && { paymentMode }),
                    ...(hasPrescription !== undefined && { hasPrescription: newHasRx }),
                    ...(customerName !== undefined && { customerName }),
                    prescriptionCharge: rxCharge,
                    medicinesSubtotal,
                    grandTotal,
                },
            });

            // Replace line items if provided
            if (lineItems && lineItems.length > 0) {
                await tx.billLineItem.deleteMany({ where: { billId: id } });
                await tx.billLineItem.createMany({
                    data: lineItems.map((li, i) => ({
                        billId: id,
                        medicineName: li.medicineName,
                        quantity: li.quantity,
                        costPerPiece: li.costPerPiece,
                        subtotal: li.quantity * li.costPerPiece,
                        sortOrder: i,
                    })),
                });
            }

            // Audit log
            await tx.auditLog.create({
                data: {
                    performedBy: session.user!.id,
                    actionType: "EDIT",
                    targetBillId: id,
                    previousState,
                    notes: notes || `Edited bill ${current.billNumber}`,
                },
            });

            return bill;
        });

        return NextResponse.json({ success: true, billNumber: updated.billNumber });
    } catch (error) {
        console.error("Bill edit error:", error);
        return NextResponse.json(
            { error: "Failed to edit bill" },
            { status: 500 }
        );
    }
}


/**
 * DELETE /api/bills/:id — Soft-delete a bill (admin only).
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const bill = await prisma.bill.findUnique({
            where: { id },
            select: { id: true, isDeleted: true, billNumber: true },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        if (bill.isDeleted) {
            return NextResponse.json(
                { error: "Bill already deleted" },
                { status: 400 }
            );
        }

        await prisma.bill.update({
            where: { id },
            data: { isDeleted: true },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                performedBy: session.user.id,
                actionType: "DELETE",
                targetBillId: id,
                notes: `Soft-deleted bill ${bill.billNumber}`,
            },
        });

        return NextResponse.json({ success: true, billNumber: bill.billNumber });
    } catch (error) {
        console.error("Bill delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete bill" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/bills/:id — Get a single bill with line items.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const bill = await prisma.bill.findUnique({
            where: { id, isDeleted: false },
            include: {
                lineItems: { orderBy: { sortOrder: "asc" } },
                user: { select: { fullName: true, username: true } },
            },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        // Employees can only see their own bills
        if (session.user.role !== "ADMIN" && bill.createdBy !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({
            bill: {
                id: bill.id,
                billNumber: bill.billNumber,
                createdAt: bill.createdAt.toISOString(),
                customerName: bill.customerName,
                paymentMode: bill.paymentMode,
                hasPrescription: bill.hasPrescription,
                prescriptionCharge: Number(bill.prescriptionCharge),
                medicinesSubtotal: Number(bill.medicinesSubtotal),
                grandTotal: Number(bill.grandTotal),
                createdByName: bill.user.fullName,
                lineItems: bill.lineItems.map((li) => ({
                    medicineName: li.medicineName,
                    quantity: li.quantity,
                    costPerPiece: Number(li.costPerPiece),
                    subtotal: Number(li.subtotal),
                })),
            },
        });
    } catch (error) {
        console.error("Bill detail error:", error);
        return NextResponse.json(
            { error: "Failed to fetch bill" },
            { status: 500 }
        );
    }
}
