import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Middleware for route protection and role enforcement.
 *
 * - Unauthenticated users → redirect to /login
 * - Employees accessing /admin/* → redirect to /bills/new
 * - Authenticated users accessing /login → redirect based on role
 */
export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session?.user;
    const isAdmin = session?.user?.role === "ADMIN";
    const path = nextUrl.pathname;

    // Public paths that don't require session auth
    const isPublicPath =
        path === "/login" ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/reports");

    if (isPublicPath) {
        // If logged in and trying to access login, redirect
        if (isLoggedIn && path === "/login") {
            const redirectTo = isAdmin ? "/admin/dashboard" : "/bills/new";
            return NextResponse.redirect(new URL(redirectTo, nextUrl));
        }
        return NextResponse.next();
    }

    // All other paths require authentication
    if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(loginUrl);
    }

    // Admin routes require ADMIN role
    if (path.startsWith("/admin") && !isAdmin) {
        return NextResponse.redirect(new URL("/bills/new", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         * - PWA files (manifest.json, sw.js, offline.html)
         * - Public assets (.svg, .png, .jpg, .ico, .webp)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|offline.html|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.ico$|.*\\.webp$).*)",
    ],
};
