import { prisma } from "@/lib/prisma";

/**
 * Email configuration keys stored in the SystemConfig table.
 * Values here override the corresponding env vars so that the
 * admin settings page actually takes effect.
 *
 * Resolution order:  DB value → env var → default
 */

export interface EmailConfig {
    resendApiKey: string | null;
    adminEmail: string | null;
    fromEmail: string;
}

const DB_KEYS = ["RESEND_API_KEY", "ADMIN_EMAIL", "RESEND_FROM_EMAIL"] as const;

const DEFAULT_FROM = "onboarding@resend.dev";

/**
 * Read email config from DB first, fall back to env vars.
 * Caches nothing — always reads fresh from DB so admin changes
 * take effect immediately.
 */
export async function getEmailConfig(): Promise<EmailConfig> {
    let dbValues: Record<string, string> = {};

    try {
        const rows = await prisma.systemConfig.findMany({
            where: { configKey: { in: [...DB_KEYS] } },
        });
        for (const row of rows) {
            if (row.configValue) {
                dbValues[row.configKey] = row.configValue;
            }
        }
    } catch {
        // DB read failed — fall through to env vars
        console.warn("getEmailConfig: could not read SystemConfig, using env vars");
    }

    return {
        resendApiKey:
            dbValues["RESEND_API_KEY"] || process.env.RESEND_API_KEY || null,
        adminEmail:
            dbValues["ADMIN_EMAIL"] || process.env.ADMIN_EMAIL || null,
        fromEmail:
            dbValues["RESEND_FROM_EMAIL"] ||
            process.env.RESEND_FROM_EMAIL ||
            DEFAULT_FROM,
    };
}
