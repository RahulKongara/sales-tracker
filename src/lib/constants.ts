/**
 * System-wide constants for the Pharmacy Sales Dashboard.
 * Values here are referenced across frontend and backend.
 */

/** Fixed prescription charge in ₹ (stored in SystemConfig for v2.0+ editability) */
export const PRESCRIPTION_CHARGE = 350;

/** Available payment modes */
export const PAYMENT_MODES = ["CASH", "CARD", "PAYTM"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/** Payment mode display config */
export const PAYMENT_MODE_CONFIG: Record<
    PaymentMode,
    { label: string; color: string; lightBg: string }
> = {
    CASH: { label: "₹ Cash", color: "#16A34A", lightBg: "#F0FDF4" },
    CARD: { label: "Card", color: "#2563EB", lightBg: "#EFF6FF" },
    PAYTM: { label: "Paytm", color: "#06B6D4", lightBg: "#ECFEFF" },
};

/** Session max age = 13.75 hours (9:00 AM – 10:45 PM IST shift) in seconds */
export const SESSION_MAX_AGE = 49500;

/** Pharmacy name — used in bill exports and emails */
export const PHARMACY_NAME = "Pharmacy Sales Dashboard";

/** Timezone */
export const TIMEZONE = "Asia/Kolkata";
export const TIMEZONE_OFFSET = "+05:30";

/** Data retention window in days (1 year) */
export const DATA_RETENTION_DAYS = 365;

/** User roles */
export const ROLES = ["ADMIN", "EMPLOYEE"] as const;
export type Role = (typeof ROLES)[number];
