import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Prisma client singleton.
 * In development, the client is cached on `globalThis` to survive
 * Next.js hot-reloads without exhausting database connections.
 *
 * Prisma v6 reads DATABASE_URL from .env / .env.local automatically.
 * Neon pooled connection is used for the app runtime.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
