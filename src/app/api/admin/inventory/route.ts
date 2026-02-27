import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/inventory — Inventory overview.
 * Returns all batches sorted by expiry, low-stock medicines, near-expiry batches (within 30 days).
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [batches, medicines] = await Promise.all([
            prisma.stockBatch.findMany({
                include: { medicine: { select: { name: true, reorderLevel: true } } },
                orderBy: { expiryDate: "asc" },
            }),
            prisma.medicine.findMany({
                where: { isActive: true },
                orderBy: { name: "asc" },
            }),
        ]);

        // Low stock medicines
        const lowStockMedicines = medicines.filter((m) => m.currentStock <= m.reorderLevel);

        // Near-expiry batches
        const nearExpiryBatches = batches.filter(
            (b) => b.expiryDate <= thirtyDaysFromNow && b.quantityRemaining > 0
        );

        return NextResponse.json({
            batches: batches.map((b) => ({
                id: b.id,
                medicineId: b.medicineId,
                medicineName: b.medicine.name,
                batchNumber: b.batchNumber,
                manufactureDate: b.manufactureDate.toISOString(),
                expiryDate: b.expiryDate.toISOString(),
                quantityReceived: b.quantityReceived,
                quantityRemaining: b.quantityRemaining,
                costPricePerPiece: b.costPricePerPiece ? Number(b.costPricePerPiece) : null,
                receivedAt: b.receivedAt.toISOString(),
            })),
            lowStockMedicines: lowStockMedicines.map((m) => ({
                id: m.id,
                name: m.name,
                category: m.category,
                currentStock: m.currentStock,
                reorderLevel: m.reorderLevel,
            })),
            nearExpiryBatches: nearExpiryBatches.map((b) => ({
                id: b.id,
                medicineId: b.medicineId,
                medicineName: b.medicine.name,
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate.toISOString(),
                quantityRemaining: b.quantityRemaining,
            })),
        });
    } catch (error) {
        console.error("Inventory overview error:", error);
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }
}
