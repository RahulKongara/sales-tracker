"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
                <div className="w-4 h-4" />
            </div>
        );
    }

    function cycleTheme() {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    }

    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
    const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

    return (
        <button
            onClick={cycleTheme}
            className={`
                flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium
                text-fg-secondary hover:bg-surface-secondary hover:text-fg transition-colors
                ${collapsed ? "justify-center" : ""}
            `}
            title={collapsed ? `Theme: ${label}` : undefined}
            aria-label={`Switch theme (currently ${label})`}
        >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
        </button>
    );
}
