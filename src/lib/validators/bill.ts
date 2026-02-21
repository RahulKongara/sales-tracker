import { z } from "zod";

export const lineItemSchema = z.object({
    medicineName: z
        .string()
        .min(1, "Medicine name is required")
        .max(200, "Name too long")
        .trim(),
    quantity: z
        .number()
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
        .max(9999, "Quantity too large"),
    costPerPiece: z
        .number()
        .min(0, "Cost cannot be negative")
        .max(99999.99, "Cost too large"),
});

export const billSchema = z.object({
    customerName: z
        .string()
        .max(200, "Name too long")
        .trim()
        .optional()
        .or(z.literal("")),
    paymentMode: z.enum(["CASH", "CARD", "PAYTM"], {
        message: "Payment mode is required",
    }),
    hasPrescription: z.boolean().default(false),
    lineItems: z
        .array(lineItemSchema)
        .min(1, "At least one medicine is required")
        .max(50, "Maximum 50 items per bill"),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
export type BillInput = z.infer<typeof billSchema>;
