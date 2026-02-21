import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/users — List all users.
 * POST /api/admin/users — Create a new employee.
 */
export async function GET() {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: { select: { bills: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({
            users: users.map((u) => ({
                id: u.id,
                fullName: u.fullName,
                username: u.username,
                role: u.role,
                isActive: u.isActive,
                createdAt: u.createdAt.toISOString(),
                billCount: u._count.bills,
            })),
        });
    } catch (error) {
        console.error("Users list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { fullName, username, password, role } = body;

        if (!fullName || !username || !password) {
            return NextResponse.json(
                { error: "Full name, username, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check unique username
        const existing = await prisma.user.findUnique({
            where: { username },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                fullName,
                username,
                passwordHash,
                role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                role: true,
                isActive: true,
            },
        });

        return NextResponse.json({ success: true, user }, { status: 201 });
    } catch (error) {
        console.error("Create user error:", error);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}
