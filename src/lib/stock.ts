import { Prisma } from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

/**
 * Deducts stock FIFO (oldest non-expired batches first) for a line item.
 * Records StockDeduction rows and updates Medicine.currentStock.
 * Returns { deducted: number, insufficient: boolean }
 */
export async function deductStock(
    tx: TransactionClient,
    medicineId: string,
    quantity: number,
    billLineItemId: string
): Promise<{ deducted: number; insufficient: boolean }> {
    const now = new Date();

    // Get non-expired batches with remaining stock, FIFO (oldest expiry first)
    const batches = await tx.stockBatch.findMany({
        where: {
            medicineId,
            quantityRemaining: { gt: 0 },
            expiryDate: { gte: now },
        },
        orderBy: { expiryDate: "asc" },
    });

    let remaining = quantity;
    const deductions: { batchId: string; qty: number }[] = [];

    for (const batch of batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.quantityRemaining, remaining);
        deductions.push({ batchId: batch.id, qty: take });
        remaining -= take;
    }

    const deducted = quantity - remaining;
    const insufficient = remaining > 0;

    // Apply deductions
    for (const d of deductions) {
        await tx.stockDeduction.create({
            data: {
                billLineItemId,
                stockBatchId: d.batchId,
                quantity: d.qty,
            },
        });

        await tx.stockBatch.update({
            where: { id: d.batchId },
            data: { quantityRemaining: { decrement: d.qty } },
        });
    }

    // Update medicine's currentStock by actual deducted amount
    if (deducted > 0) {
        await tx.medicine.update({
            where: { id: medicineId },
            data: { currentStock: { decrement: deducted } },
        });
    }

    return { deducted, insufficient };
}

/**
 * Restores stock deductions for the given billLineItemIds.
 * Increments batch quantityRemaining and Medicine.currentStock.
 */
export async function restoreStock(
    tx: TransactionClient,
    billLineItemIds: string[]
): Promise<void> {
    if (billLineItemIds.length === 0) return;

    const deductions = await tx.stockDeduction.findMany({
        where: { billLineItemId: { in: billLineItemIds } },
        include: { stockBatch: true },
    });

    // Group deductions by medicineId to batch-update currentStock
    const medicineRestoreMap = new Map<string, number>();

    for (const d of deductions) {
        await tx.stockBatch.update({
            where: { id: d.stockBatchId },
            data: { quantityRemaining: { increment: d.quantity } },
        });

        const medicineId = d.stockBatch.medicineId;
        medicineRestoreMap.set(
            medicineId,
            (medicineRestoreMap.get(medicineId) || 0) + d.quantity
        );
    }

    for (const [medicineId, qty] of medicineRestoreMap) {
        await tx.medicine.update({
            where: { id: medicineId },
            data: { currentStock: { increment: qty } },
        });
    }
}
