"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
    LayoutDashboard,
    TrendingUp,
    Activity,
    Users,
    Settings,
    Plus,
    LogOut,
    ChevronsLeft,
    Ellipsis,
    type LucideIcon,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────── */
/*  Nav items                                                     */
/* ────────────────────────────────────────────────────────────── */

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/activity", label: "Activity", icon: Activity },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/config", label: "Config", icon: Settings },
];

/* Items shown directly in the mobile bottom bar (excluding center button) */
const MOBILE_BAR_ITEMS: NavItem[] = [
    NAV_ITEMS[0], // Dashboard
    NAV_ITEMS[1], // Analytics
    // ── center "New Bill" button goes here ──
    NAV_ITEMS[3], // Users
];

/* Items that go into the "More" dropdown on mobile */
const MOBILE_MORE_ITEMS: NavItem[] = [
    NAV_ITEMS[2], // Activity
    NAV_ITEMS[4], // Config
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
                            Sales Tracker
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-md hover:bg-surface-secondary text-fg-muted hover:text-fg transition-colors"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <ChevronsLeft
                            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* Quick actions */}
                <div className="px-3 pt-3 pb-1 shrink-0">
                    <Link
                        href="/bills/new"
                        className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                            bg-green-600/10 text-green-700 dark:text-green-400
                            hover:bg-green-600/20 transition-colors
                            ${collapsed ? "justify-center" : ""}
                        `}
                        title={collapsed ? "New Bill" : undefined}
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>New Bill</span>}
                    </Link>
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
                        const Icon = item.icon;
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
                                <Icon className="w-4 h-4 shrink-0" />
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
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* ── Mobile Bottom Bar ───────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-area-bottom">
                <div className="flex items-center justify-around h-14">
                    {/* Left two items */}
                    {MOBILE_BAR_ITEMS.slice(0, 2).map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
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
                                <Icon className="w-5 h-5" />
                                <span className="text-[0.5625rem] font-medium leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Center: New Bill (raised, bigger) */}
                    <Link
                        href="/bills/new"
                        className="flex flex-col items-center gap-0.5 -mt-5"
                    >
                        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 active:scale-95 transition-transform">
                            <Plus className="w-6 h-6" strokeWidth={2.5} />
                        </span>
                        <span className="text-[0.5625rem] font-medium leading-none text-fg-muted">
                            New Bill
                        </span>
                    </Link>

                    {/* Right two items */}
                    {MOBILE_BAR_ITEMS.slice(2).map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
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
                                <Icon className="w-5 h-5" />
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

    const isExtraActive = MOBILE_MORE_ITEMS.some((i) => pathname === i.href);

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
                <Ellipsis className="w-5 h-5" />
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
                        {MOBILE_MORE_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
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
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Sign out */}
                        <button
                            key="signout"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
