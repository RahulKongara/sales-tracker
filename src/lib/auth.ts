import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

/**
 * Full NextAuth v5 configuration (server-only).
 *
 * Extends the edge-safe authConfig with the Credentials provider
 * that uses bcryptjs (heavy) and prisma (Node-only). This file
 * must NEVER be imported in middleware — use auth.config.ts there.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const username = credentials.username as string;
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { username },
                });

                if (!user || !user.isActive) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.fullName,
                    role: user.role,
                };
            },
        }),
    ],
});
