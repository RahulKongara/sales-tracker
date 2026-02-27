import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/inventory/stock-entry — Add a stock batch.
 * Increments Medicine.currentStock by quantityReceived.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            medicineId,
            batchNumber,
            manufactureDate,
            expiryDate,
            quantityReceived,
            costPricePerPiece,
            notes,
        } = body as {
            medicineId: string;
            batchNumber: string;
            manufactureDate: string;
            expiryDate: string;
            quantityReceived: number;
            costPricePerPiece?: number;
            notes?: string;
        };

        if (!medicineId || !batchNumber?.trim()) {
            return NextResponse.json(
                { error: "medicineId and batchNumber are required" },
                { status: 400 }
            );
        }
        if (!manufactureDate || !expiryDate) {
            return NextResponse.json(
                { error: "manufactureDate and expiryDate are required" },
                { status: 400 }
            );
        }
        if (!quantityReceived || quantityReceived < 1) {
            return NextResponse.json(
                { error: "quantityReceived must be at least 1" },
                { status: 400 }
            );
        }

        const mfgDate = new Date(manufactureDate);
        const expDate = new Date(expiryDate);

        if (isNaN(mfgDate.getTime()) || isNaN(expDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }
        if (expDate <= mfgDate) {
            return NextResponse.json(
                { error: "Expiry date must be after manufacture date" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const batch = await tx.stockBatch.create({
                data: {
                    medicineId,
                    batchNumber: batchNumber.trim(),
                    manufactureDate: mfgDate,
                    expiryDate: expDate,
                    quantityReceived,
                    quantityRemaining: quantityReceived,
                    costPricePerPiece: costPricePerPiece ?? null,
                    notes: notes?.trim() || null,
                    createdById: session.user!.id,
                },
            });

            await tx.medicine.update({
                where: { id: medicineId },
                data: { currentStock: { increment: quantityReceived } },
            });

            return batch;
        });

        return NextResponse.json(
            {
                success: true,
                batch: {
                    id: result.id,
                    batchNumber: result.batchNumber,
                    quantityReceived: result.quantityReceived,
                    expiryDate: result.expiryDate.toISOString(),
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "code" in error &&
            (error as { code: string }).code === "P2025"
        ) {
            return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
        }
        console.error("Stock entry error:", error);
        return NextResponse.json({ error: "Failed to add stock" }, { status: 500 });
    }
}
