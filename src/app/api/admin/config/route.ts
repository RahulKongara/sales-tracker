import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET/PUT /api/admin/config
 *
 * Admin-only system configuration management.
 * Stores key-value pairs in the SystemConfig table.
 *
 * Current keys: ADMIN_EMAIL, RESEND_API_KEY, RESEND_FROM_EMAIL
 */

const ALLOWED_KEYS = [
    "ADMIN_EMAIL",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
] as const;

// ── GET: Read all config values ──────────────────────────────────

export async function GET() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const configs = await prisma.systemConfig.findMany({
            where: { configKey: { in: [...ALLOWED_KEYS] } },
        });

        // Convert to key-value map, masking sensitive values
        const result: Record<string, string> = {};
        for (const c of configs) {
            if (c.configKey === "RESEND_API_KEY" && c.configValue) {
                // Mask API key — show first 4 and last 4 chars
                const v = c.configValue;
                result[c.configKey] =
                    v.length > 10
                        ? `${v.slice(0, 4)}${"•".repeat(v.length - 8)}${v.slice(-4)}`
                        : "••••••••";
            } else {
                result[c.configKey] = c.configValue;
            }
        }

        return NextResponse.json({ success: true, config: result });
    } catch (error) {
        console.error("Config read error:", error);
        return NextResponse.json(
            { error: "Failed to load configuration" },
            { status: 500 }
        );
    }
}

// ── PUT: Update config values ────────────────────────────────────

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const updates: { key: string; value: string }[] = [];

        for (const key of ALLOWED_KEYS) {
            if (key in body && typeof body[key] === "string") {
                updates.push({ key, value: body[key].trim() });
            }
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: "No valid config keys provided" },
                { status: 400 }
            );
        }

        // Upsert each config key
        await prisma.$transaction(
            updates.map((u) =>
                prisma.systemConfig.upsert({
                    where: { configKey: u.key },
                    create: { configKey: u.key, configValue: u.value },
                    update: { configValue: u.value },
                })
            )
        );

        return NextResponse.json({
            success: true,
            updated: updates.map((u) => u.key),
        });
    } catch (error) {
        console.error("Config update error:", error);
        return NextResponse.json(
            { error: "Failed to update configuration" },
            { status: 500 }
        );
    }
}
