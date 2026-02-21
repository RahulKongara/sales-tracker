import type { NextAuthConfig } from "next-auth";
import { SESSION_MAX_AGE } from "@/lib/constants";

/**
 * Edge-safe auth configuration.
 *
 * This config contains ONLY the parts of NextAuth that can run
 * in the Edge runtime (middleware). Heavy imports like bcryptjs
 * and prisma are NOT included here — they live in auth.ts.
 *
 * The Credentials provider is declared here with an empty
 * authorize() so NextAuth registers the provider shape, but
 * the real authorize logic is in auth.ts.
 */
export const authConfig: NextAuthConfig = {
    providers: [], // Populated in auth.ts with actual Credentials provider
    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE,
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
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
        // Middleware uses this callback to check auth
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdmin = (auth?.user as { role?: string })?.role === "ADMIN";
            const path = nextUrl.pathname;

            // Public paths
            const isPublicPath =
                path === "/login" ||
                path.startsWith("/api/auth") ||
                path.startsWith("/api/reports");

            if (isPublicPath) {
                if (isLoggedIn && path === "/login") {
                    const redirectTo = isAdmin
                        ? "/admin/dashboard"
                        : "/bills/new";
                    return Response.redirect(new URL(redirectTo, nextUrl));
                }
                return true;
            }

            // Require auth
            if (!isLoggedIn) return false; // → auto-redirects to signIn page

            // Admin routes require ADMIN role
            if (path.startsWith("/admin") && !isAdmin) {
                return Response.redirect(new URL("/bills/new", nextUrl));
            }

            return true;
        },
    },
};
