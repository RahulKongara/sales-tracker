import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/medicines/:id — Medicine detail with stock batches.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const medicine = await prisma.medicine.findUnique({
            where: { id },
            include: {
                stockBatches: {
                    orderBy: { expiryDate: "asc" },
                    include: { createdBy: { select: { fullName: true } } },
                },
            },
        });

        if (!medicine) {
            return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
        }

        return NextResponse.json({
            medicine: {
                id: medicine.id,
                name: medicine.name,
                category: medicine.category,
                defaultPrice: Number(medicine.defaultPrice),
                reorderLevel: medicine.reorderLevel,
                currentStock: medicine.currentStock,
                isActive: medicine.isActive,
                createdAt: medicine.createdAt.toISOString(),
                stockBatches: medicine.stockBatches.map((b) => ({
                    id: b.id,
                    batchNumber: b.batchNumber,
                    manufactureDate: b.manufactureDate.toISOString(),
                    expiryDate: b.expiryDate.toISOString(),
                    quantityReceived: b.quantityReceived,
                    quantityRemaining: b.quantityRemaining,
                    costPricePerPiece: b.costPricePerPiece ? Number(b.costPricePerPiece) : null,
                    notes: b.notes,
                    receivedAt: b.receivedAt.toISOString(),
                    createdByName: b.createdBy.fullName,
                })),
            },
        });
    } catch (error) {
        console.error("Medicine detail error:", error);
        return NextResponse.json({ error: "Failed to fetch medicine" }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/medicines/:id — Update medicine details.
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
        const { name, category, defaultPrice, reorderLevel, isActive } = body as {
            name?: string;
            category?: string | null;
            defaultPrice?: number;
            reorderLevel?: number;
            isActive?: boolean;
        };

        // Bug fix: reject empty name on the server side
        if (name !== undefined && name.trim() === "") {
            return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
        }

        const medicine = await prisma.medicine.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(category !== undefined && { category: category?.trim() || null }),
                ...(defaultPrice !== undefined && { defaultPrice }),
                ...(reorderLevel !== undefined && { reorderLevel }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json({
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
        });
    } catch (error: unknown) {
        const code = error instanceof Error && "code" in error
            ? (error as { code: string }).code
            : null;
        if (code === "P2025") {
            return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
        }
        // Bug fix: name uniqueness conflict
        if (code === "P2002") {
            return NextResponse.json(
                { error: "A medicine with this name already exists" },
                { status: 409 }
            );
        }
        console.error("Medicine update error:", error);
        return NextResponse.json({ error: "Failed to update medicine" }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/medicines/:id — Soft deactivate (isActive = false).
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
        await prisma.medicine.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            "code" in error &&
            (error as { code: string }).code === "P2025"
        ) {
            return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
        }
        console.error("Medicine deactivate error:", error);
        return NextResponse.json({ error: "Failed to deactivate medicine" }, { status: 500 });
    }
}
