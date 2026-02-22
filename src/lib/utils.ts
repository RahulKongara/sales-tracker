import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx — handles conditional classes
 * and resolves Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * e.g. 24580 → "₹24,580.00"
 */
export function formatCurrency(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}

/**
 * Convert a UTC Date to IST and return as Date object.
 */
export function toIST(date: Date): Date {
    const IST_OFFSET_MS = 330 * 60 * 1000;
    return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Return the current (or given) date as a YYYY-MM-DD string in IST.
 * Uses deterministic UTC offset math — safe in every Node / browser environment.
 */
export function toISTDateString(date?: Date): string {
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const istTime = new Date((date ?? new Date()).getTime() + IST_OFFSET_MS);
    const yyyy = istTime.getUTCFullYear();
    const mm = String(istTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(istTime.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a UTC Date to IST display string.
 * e.g. "17 Feb 2025, 11:00 PM"
 */
export function formatIST(
    date: Date,
    options?: Intl.DateTimeFormatOptions
): string {
    const defaults: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    };
    return new Intl.DateTimeFormat("en-IN", { ...defaults, ...options }).format(
        date
    );
}

/**
 * Format a date as IST date-only string.
 * e.g. "17 Feb 2025"
 */
export function formatISTDate(date: Date): string {
    return formatIST(date, {
        hour: undefined,
        minute: undefined,
        hour12: undefined,
    });
}

/**
 * Format a date as IST time-only string.
 * e.g. "11:00 PM"
 */
export function formatISTTime(date: Date): string {
    return formatIST(date, {
        day: undefined,
        month: undefined,
        year: undefined,
    });
}

/**
 * Get today's date boundaries in UTC (for IST day).
 * Returns { start: Date (00:00 IST in UTC), end: Date (23:59:59 IST in UTC) }
 */
export function getISTDayBounds(date?: Date): { start: Date; end: Date } {
    const now = date ?? new Date();
    // IST is UTC+5:30 (330 minutes). Compute IST date components directly
    // instead of relying on locale-dependent toLocaleString formatting.
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const istTime = new Date(now.getTime() + IST_OFFSET_MS);
    const yyyy = istTime.getUTCFullYear();
    const mm = String(istTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(istTime.getUTCDate()).padStart(2, "0");
    const istStr = `${yyyy}-${mm}-${dd}`;

    const start = new Date(`${istStr}T00:00:00.000+05:30`);
    const end = new Date(`${istStr}T23:59:59.999+05:30`);

    // Safety guard — should never happen with the deterministic format above
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        // Fall back to ±12 h around `now` so queries never crash
        const fallbackStart = new Date(now);
        fallbackStart.setUTCHours(0, 0, 0, 0);
        const fallbackEnd = new Date(now);
        fallbackEnd.setUTCHours(23, 59, 59, 999);
        return { start: fallbackStart, end: fallbackEnd };
    }

    return { start, end };
}

/**
 * Validate and parse a user-supplied date string (expected YYYY-MM-DD) into
 * IST start-of-day / end-of-day Date objects.
 *
 * Returns `null` if the value is falsy or not in YYYY-MM-DD format, so
 * callers can fall back to a sensible default (e.g. today or last-7-days).
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISTDateParam(
    value: string | null | undefined
): { start: Date; end: Date } | null {
    if (!value || !DATE_RE.test(value)) return null;

    const start = new Date(`${value}T00:00:00.000+05:30`);
    const end = new Date(`${value}T23:59:59.999+05:30`);

    // Guard against edge cases like "9999-99-99" which regex allows but Date rejects
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    return { start, end };
}

/**
 * Generate a bill number in format YYYYMMDD-NNNN.
 * @param sequenceNumber The sequential number for the day
 */
export function generateBillNumber(
    date: Date,
    sequenceNumber: number
): string {
    const IST_OFFSET_MS = 330 * 60 * 1000;
    const istTime = new Date(date.getTime() + IST_OFFSET_MS);
    const yyyy = istTime.getUTCFullYear();
    const mm = String(istTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(istTime.getUTCDate()).padStart(2, "0");
    const seq = String(sequenceNumber).padStart(4, "0");
    return `${yyyy}${mm}${dd}-${seq}`;
}
