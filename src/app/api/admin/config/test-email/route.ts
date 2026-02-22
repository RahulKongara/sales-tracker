import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PHARMACY_NAME } from "@/lib/constants";
import { sendEmailWithRetry } from "@/lib/email-retry";
import { getEmailConfig } from "@/lib/email-config";
import { wrapEmailTemplate } from "@/lib/email-templates";

/**
 * POST /api/admin/config/test-email — Send a test email to verify configuration.
 * Requires admin session.
 */
export async function POST() {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emailConfig = await getEmailConfig();
    const resendKey = emailConfig.resendApiKey;
    const adminEmail = emailConfig.adminEmail;

    if (!resendKey || !adminEmail) {
        return NextResponse.json(
            { error: "Email not configured. Set Admin Email and Resend API Key first." },
            { status: 400 }
        );
    }

    const bodyHtml = `
      <div style="text-align:center; padding:20px 0;">
        <div style="font-size:40px; margin-bottom:12px;">&#10003;</div>
        <h2 style="margin:0 0 8px; font-size:18px; font-weight:700; color:#111827;">Email Configured Successfully</h2>
        <p style="margin:0; font-size:14px; color:#6B7280;">
          Your daily, monthly, and annual reports will be delivered to this address.
        </p>
      </div>
    `;

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const htmlBody = wrapEmailTemplate("Test", dateStr, bodyHtml);

    const result = await sendEmailWithRetry(resendKey, {
        from: `${PHARMACY_NAME} <${emailConfig.fromEmail}>`,
        to: adminEmail,
        subject: `Test Email — ${PHARMACY_NAME}`,
        html: htmlBody,
    });

    if (result.sent) {
        return NextResponse.json({ success: true, sent: true });
    }

    return NextResponse.json(
        { error: result.error || "Failed to send test email", sent: false },
        { status: 500 }
    );
}
