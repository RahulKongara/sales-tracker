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
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
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
    const istStr = now.toLocaleString("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    // IST is UTC+5:30 → subtract 5:30 to get UTC midnight
    const start = new Date(`${istStr}T00:00:00.000+05:30`);
    const end = new Date(`${istStr}T23:59:59.999+05:30`);
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
    const istDate = new Date(
        date.toLocaleString("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
    );
    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, "0");
    const dd = String(istDate.getDate()).padStart(2, "0");
    const seq = String(sequenceNumber).padStart(4, "0");
    return `${yyyy}${mm}${dd}-${seq}`;
}
