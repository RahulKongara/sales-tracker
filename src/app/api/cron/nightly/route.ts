import { NextResponse } from "next/server";
import { toIST } from "@/lib/utils";

/**
 * POST /api/cron/nightly — Nightly dispatcher for automated reports.
 *
 * Triggered by QStash at 17:30 UTC (11:00 PM IST) every day.
 * Dispatches to the appropriate report endpoints based on the current IST date:
 *  - Daily report: every night
 *  - Monthly report: last day of the month
 *  - Annual report: January 1st (for the previous year)
 */
export async function POST(req: Request) {
    // ── Auth ──
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Determine base URL ──
    const vercelUrl = process.env.VERCEL_URL;
    const baseUrl = vercelUrl
        ? `https://${vercelUrl}`
        : "http://localhost:3000";

    const headers: HeadersInit = {};
    if (cronSecret) {
        headers["Authorization"] = `Bearer ${cronSecret}`;
    }

    // ── IST date checks ──
    const now = new Date();
    const ist = toIST(now);
    const istDay = ist.getUTCDate();
    const istMonth = ist.getUTCMonth(); // 0-indexed
    const istYear = ist.getUTCFullYear();

    // Last day of the current IST month
    const lastDayOfMonth = new Date(
        Date.UTC(istYear, istMonth + 1, 0)
    ).getUTCDate();

    const isLastDayOfMonth = istDay === lastDayOfMonth;
    const isJanFirst = istMonth === 0 && istDay === 1;

    // ── Dispatch reports ──
    const results: Record<string, { status: number; ok: boolean }> = {};

    // Always send the daily report
    try {
        const res = await fetch(`${baseUrl}/api/reports/daily`, {
            method: "POST",
            headers,
        });
        results.daily = { status: res.status, ok: res.ok };
    } catch (err) {
        results.daily = {
            status: 500,
            ok: false,
        };
    }

    // Monthly report on the last day of the month
    if (isLastDayOfMonth) {
        try {
            const res = await fetch(`${baseUrl}/api/reports/monthly`, {
                method: "POST",
                headers,
            });
            results.monthly = { status: res.status, ok: res.ok };
        } catch (err) {
            results.monthly = {
                status: 500,
                ok: false,
            };
        }
    }

    // Annual report on January 1st
    if (isJanFirst) {
        try {
            const res = await fetch(`${baseUrl}/api/reports/annual`, {
                method: "POST",
                headers,
            });
            results.annual = { status: res.status, ok: res.ok };
        } catch (err) {
            results.annual = {
                status: 500,
                ok: false,
            };
        }
    }

    const allOk = Object.values(results).every((r) => r.ok);

    return NextResponse.json(
        {
            triggered: Object.keys(results),
            results,
            istDate: `${istYear}-${String(istMonth + 1).padStart(2, "0")}-${String(istDay).padStart(2, "0")}`,
            isLastDayOfMonth,
            isJanFirst,
        },
        { status: allOk ? 200 : 207 }
    );
}
