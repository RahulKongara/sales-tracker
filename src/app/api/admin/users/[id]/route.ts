import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/admin/users/:id — Toggle active status or reset password.
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

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent self-deactivation
        if (id === session.user.id && body.isActive === false) {
            return NextResponse.json(
                { error: "Cannot deactivate yourself" },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};

        // Toggle active
        if (typeof body.isActive === "boolean") {
            updateData.isActive = body.isActive;
        }

        // Reset password
        if (body.newPassword) {
            if (body.newPassword.length < 6) {
                return NextResponse.json(
                    { error: "Password must be at least 6 characters" },
                    { status: 400 }
                );
            }
            updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No changes provided" },
                { status: 400 }
            );
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                username: true,
                role: true,
                isActive: true,
            },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
