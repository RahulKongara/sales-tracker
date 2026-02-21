import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_MAX_AGE } from "@/lib/constants";

/**
 * NextAuth v5 configuration.
 *
 * Uses Credentials provider (username + password) against
 * the `users` table. JWT strategy for stateless sessions.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
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
    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE,
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            // On first sign-in, attach role and userId
            if (user) {
                token.role = (user as { role: string }).role;
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                (session.user as { role: string }).role = token.role as string;
            }
            return session;
        },
    },
});
