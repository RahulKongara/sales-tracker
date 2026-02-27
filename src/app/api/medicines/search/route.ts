import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medicines/search?q= — Search medicines for autocomplete.
 * Accessible by any authenticated user.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 1) {
        return NextResponse.json({ medicines: [] });
    }

    try {
        const medicines = await prisma.medicine.findMany({
            where: {
                name: { contains: q, mode: "insensitive" },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                defaultPrice: true,
                currentStock: true,
                reorderLevel: true,
                category: true,
            },
            orderBy: { name: "asc" },
            take: 8,
        });

        return NextResponse.json({
            medicines: medicines.map((m) => ({
                id: m.id,
                name: m.name,
                defaultPrice: Number(m.defaultPrice),
                currentStock: m.currentStock,
                reorderLevel: m.reorderLevel,
                category: m.category,
            })),
        });
    } catch (error) {
        console.error("Medicine search error:", error);
        return NextResponse.json({ error: "Failed to search medicines" }, { status: 500 });
    }
}
