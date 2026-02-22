"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

/* ────────────────────────────────────────────────────────────── */
/*  Nav items                                                     */
/* ────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/analytics", label: "Analytics", icon: "📈" },
    { href: "/admin/activity", label: "Activity", icon: "📋" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/config", label: "Config", icon: "⚙️" },
];

const QUICK_ACTIONS = [
    { href: "/bills/new", label: "New Bill", icon: "➕" },
];

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                     */
/* ────────────────────────────────────────────────────────────── */

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* ── Desktop Sidebar ─────────────────────────────── */}
            <aside
                className={`
                    hidden md:flex flex-col fixed top-0 left-0 h-dvh z-40
                    bg-surface border-r border-border
                    transition-all duration-200 ease-in-out
                    ${collapsed ? "w-[68px]" : "w-56"}
                `}
            >
                {/* Brand / Collapse toggle */}
                <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
                    {!collapsed && (
                        <span className="text-sm font-bold tracking-tight text-fg truncate">
                            💊 Sales Tracker
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-md hover:bg-surface-secondary text-fg-muted hover:text-fg transition-colors"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Quick actions */}
                <div className="px-3 pt-3 pb-1 shrink-0">
                    {QUICK_ACTIONS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                                bg-green-600/10 text-green-700 dark:text-green-400
                                hover:bg-green-600/20 transition-colors
                                ${collapsed ? "justify-center" : ""}
                            `}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="text-base">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </div>

                {/* Divider label */}
                {!collapsed && (
                    <div className="px-5 pt-4 pb-1">
                        <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-fg-muted">
                            Admin
                        </span>
                    </div>
                )}

                {/* Nav links */}
                <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                                    transition-colors duration-150
                                    ${collapsed ? "justify-center" : ""}
                                    ${isActive
                                        ? "bg-fg text-fg-inverted shadow-xs"
                                        : "text-fg-secondary hover:bg-surface-secondary hover:text-fg"
                                    }
                                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="text-base shrink-0">{item.icon}</span>
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign out */}
                <div className="px-3 py-3 border-t border-border shrink-0">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className={`
                            flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium
                            text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors
                            ${collapsed ? "justify-center" : ""}
                        `}
                        title={collapsed ? "Sign Out" : undefined}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* ── Mobile Bottom Bar ───────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-bottom">
                <div className="flex items-center justify-around h-14">
                    {NAV_ITEMS.slice(0, 4).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg
                                    transition-colors duration-150 min-w-[52px]
                                    ${isActive
                                        ? "text-fg"
                                        : "text-fg-muted hover:text-fg-secondary"
                                    }
                                `}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-[0.5625rem] font-medium leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    {/* More menu with remaining items */}
                    <MobileMoreMenu />
                </div>
            </nav>
        </>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Mobile "More" dropdown                                        */
/* ────────────────────────────────────────────────────────────── */

function MobileMoreMenu() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const extra = [
        ...NAV_ITEMS.slice(4),
        ...QUICK_ACTIONS,
        { href: "#signout", label: "Sign Out", icon: "🚪" },
    ];

    const isExtraActive = NAV_ITEMS.slice(4).some((i) => pathname === i.href);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`
                    flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg
                    transition-colors duration-150 min-w-[52px]
                    ${isExtraActive ? "text-fg" : "text-fg-muted hover:text-fg-secondary"}
                `}
            >
                <span className="text-lg">•••</span>
                <span className="text-[0.5625rem] font-medium leading-none">More</span>
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute bottom-full right-0 mb-2 z-50 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                        {extra.map((item) => {
                            if (item.href === "#signout") {
                                return (
                                    <button
                                        key="signout"
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            }
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`
                                        flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors
                                        ${isActive
                                            ? "bg-fg text-fg-inverted font-medium"
                                            : "text-fg-secondary hover:bg-surface-secondary hover:text-fg"
                                        }
                                    `}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
