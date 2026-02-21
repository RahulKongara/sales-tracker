import { z } from "zod";

export const loginSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required")
        .max(50, "Username must be under 50 characters")
        .trim(),
    password: z
        .string()
        .min(1, "Password is required")
        .max(100, "Password must be under 100 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
