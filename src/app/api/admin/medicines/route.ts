import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/medicines — List all medicines.
 * Supports ?q=search&category=X&lowStock=true
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const lowStock = searchParams.get("lowStock") === "true";

    try {
        const medicines = await prisma.medicine.findMany({
            where: {
                ...(q && { name: { contains: q, mode: "insensitive" } }),
                ...(category && { category: { equals: category, mode: "insensitive" } }),
            },
            orderBy: { name: "asc" },
        });

        // Apply lowStock filter in JS since Prisma can't compare two columns directly
        const filtered = lowStock
            ? medicines.filter((m) => m.currentStock <= m.reorderLevel)
            : medicines;

        return NextResponse.json({
            medicines: filtered.map((m) => ({
                id: m.id,
                name: m.name,
                category: m.category,
                defaultPrice: Number(m.defaultPrice),
                reorderLevel: m.reorderLevel,
                currentStock: m.currentStock,
                isActive: m.isActive,
            })),
        });
    } catch (error) {
        console.error("Medicine list error:", error);
        return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 });
    }
}

/**
 * POST /api/admin/medicines — Create a medicine.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, category, defaultPrice, reorderLevel } = body as {
            name: string;
            category?: string;
            defaultPrice: number;
            reorderLevel?: number;
        };

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (typeof defaultPrice !== "number" || defaultPrice < 0) {
            return NextResponse.json({ error: "Invalid default price" }, { status: 400 });
        }

        const medicine = await prisma.medicine.create({
            data: {
                name: name.trim(),
                category: category?.trim() || null,
                defaultPrice,
                reorderLevel: reorderLevel ?? 10,
            },
        });

        return NextResponse.json(
            {
                success: true,
                medicine: {
                    id: medicine.id,
                    name: medicine.name,
                    category: medicine.category,
                    defaultPrice: Number(medicine.defaultPrice),
                    reorderLevel: medicine.reorderLevel,
                    currentStock: medicine.currentStock,
                    isActive: medicine.isActive,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "code" in error &&
            (error as { code: string }).code === "P2002"
        ) {
            return NextResponse.json(
                { error: "A medicine with this name already exists" },
                { status: 409 }
            );
        }
        console.error("Medicine create error:", error);
        return NextResponse.json({ error: "Failed to create medicine" }, { status: 500 });
    }
}
