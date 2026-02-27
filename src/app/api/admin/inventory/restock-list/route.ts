import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/inventory/restock-list — Medicines where currentStock <= reorderLevel.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const medicines = await prisma.medicine.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        });

        const restockList = medicines.filter((m) => m.currentStock <= m.reorderLevel);

        return NextResponse.json({
            items: restockList.map((m) => ({
                id: m.id,
                name: m.name,
                category: m.category,
                currentStock: m.currentStock,
                reorderLevel: m.reorderLevel,
            })),
        });
    } catch (error) {
        console.error("Restock list error:", error);
        return NextResponse.json({ error: "Failed to fetch restock list" }, { status: 500 });
    }
}
