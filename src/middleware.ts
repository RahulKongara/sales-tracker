import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Edge-compatible middleware.
 *
 * Uses ONLY the lightweight authConfig (no bcrypt, no prisma).
 * The `authorized` callback in authConfig handles all routing logic.
 */
export default NextAuth(authConfig).auth;

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
