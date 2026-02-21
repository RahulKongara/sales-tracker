/**
 * Email sending with retry logic (up to 3 attempts).
 * Dynamically imports `resend` to avoid build failures when not installed.
 */

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from: string;
}

interface SendResult {
    sent: boolean;
    attempts: number;
    error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailWithRetry(
    resendKey: string,
    opts: SendEmailOptions
): Promise<SendResult> {
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);

            await resend.emails.send({
                from: opts.from,
                to: opts.to,
                subject: opts.subject,
                html: opts.html,
            });

            return { sent: true, attempts: attempt };
        } catch (err) {
            lastError = String(err);
            console.warn(
                `Email attempt ${attempt}/${MAX_RETRIES} failed:`,
                lastError
            );
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt); // Exponential-ish backoff
            }
        }
    }

    return { sent: false, attempts: MAX_RETRIES, error: lastError };
}
