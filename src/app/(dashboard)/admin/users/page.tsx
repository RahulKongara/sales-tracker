"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface User {
    id: string;
    fullName: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    billCount: number;
}

/* ────────────────────────────────────────────────────────────── */
/*  Styles                                                       */
/* ────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
};

const btnPrimary: React.CSSProperties = {
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#fff",
    background: "var(--blue-600)",
    border: "none",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    transition: "opacity 0.15s",
};

const btnSecondary: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
    padding: "0.25rem 0.5rem",
    fontSize: "0.6875rem",
    fontWeight: 500,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    border: "1px solid var(--border-default)",
    background: "var(--bg-secondary)",
    color: "var(--text-secondary)",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
};

/* ────────────────────────────────────────────────────────────── */
/*  Component                                                    */
/* ────────────────────────────────────────────────────────────── */

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        password: "",
        role: "EMPLOYEE",
    });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    // Reset password modal
    const [resetTarget, setResetTarget] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.status === 403) {
                router.push("/bills/new");
                return;
            }
            if (!res.ok) throw new Error("Failed to load users");
            const data = await res.json();
            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create user");

            setShowForm(false);
            setFormData({ fullName: "", username: "", password: "", role: "EMPLOYEE" });
            fetchUsers();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Create failed");
        } finally {
            setSubmitting(false);
        }
    }

    async function toggleActive(user: User) {
        const action = user.isActive ? "deactivate" : "activate";
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.fullName}?`))
            return;
        setActionId(user.id);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Action failed");
        } finally {
            setActionId(null);
        }
    }

    async function handleResetPassword() {
        if (!resetTarget || !newPassword) return;
        setActionId(resetTarget.id);
        try {
            const res = await fetch(`/api/admin/users/${resetTarget.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            alert(`Password reset for ${resetTarget.fullName}`);
            setResetTarget(null);
            setNewPassword("");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Reset failed");
        } finally {
            setActionId(null);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-secondary)" }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <header
                style={{
                    background: "var(--bg-primary)",
                    borderBottom: "1px solid var(--border-default)",
                    padding: "0.75rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>👥</span>
                    <h1
                        style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        User Management
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        ← Dashboard
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        style={{
                            ...btnSecondary,
                            fontSize: "0.75rem",
                            padding: "0.375rem 0.75rem",
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
                {/* ── Add User Button ────────────────────────────────── */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "1rem",
                    }}
                >
                    <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>
                        {showForm ? "Cancel" : "+ Add Employee"}
                    </button>
                </div>

                {/* ── Add User Form ──────────────────────────────────── */}
                {showForm && (
                    <div style={{ ...card, padding: "1.25rem", marginBottom: "1.5rem" }}>
                        <h2
                            style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                marginBottom: "1rem",
                            }}
                        >
                            New Employee
                        </h2>
                        <form onSubmit={handleCreate}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.75rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            color: "var(--text-secondary)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Full Name *
                                    </label>
                                    <input
                                        style={inputStyle}
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fullName: e.target.value })
                                        }
                                        placeholder="e.g. Ravi Kumar"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            color: "var(--text-secondary)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Username *
                                    </label>
                                    <input
                                        style={inputStyle}
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData({ ...formData, username: e.target.value })
                                        }
                                        placeholder="e.g. ravi"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            color: "var(--text-secondary)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Password *
                                    </label>
                                    <input
                                        style={inputStyle}
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        placeholder="Min 6 characters"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            color: "var(--text-secondary)",
                                            marginBottom: "0.25rem",
                                        }}
                                    >
                                        Role
                                    </label>
                                    <select
                                        style={{ ...inputStyle, cursor: "pointer" }}
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData({ ...formData, role: e.target.value })
                                        }
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                            {formError && (
                                <p
                                    style={{
                                        color: "var(--red-600)",
                                        fontSize: "0.75rem",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    {formError}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}
                            >
                                {submitting ? "Creating..." : "Create Employee"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── Users Table ────────────────────────────────────── */}
                <div style={{ ...card, overflow: "hidden" }}>
                    <div
                        style={{
                            padding: "1rem 1.25rem",
                            borderBottom: "1px solid var(--border-default)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                            }}
                        >
                            All Users ({users.length})
                        </h2>
                        <button
                            onClick={fetchUsers}
                            style={{
                                ...btnSecondary,
                                fontSize: "0.6875rem",
                                padding: "0.25rem 0.5rem",
                            }}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div
                            style={{
                                padding: "3rem",
                                textAlign: "center",
                                color: "var(--text-muted)",
                                fontSize: "0.875rem",
                            }}
                        >
                            Loading...
                        </div>
                    ) : error ? (
                        <div
                            style={{
                                padding: "3rem",
                                textAlign: "center",
                                color: "var(--red-600)",
                                fontSize: "0.875rem",
                            }}
                        >
                            {error}
                        </div>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "0.8125rem",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: "1px solid var(--border-default)",
                                    }}
                                >
                                    {["Name", "Username", "Role", "Status", "Bills", "Actions"].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    padding: "0.625rem 0.75rem",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    color: "var(--text-secondary)",
                                                    fontSize: "0.75rem",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderBottom: "1px solid var(--border-light)",
                                            opacity: user.isActive ? 1 : 0.5,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "0.625rem 0.75rem",
                                                fontWeight: 500,
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {user.fullName}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.625rem 0.75rem",
                                                fontFamily: "var(--font-mono)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {user.username}
                                        </td>
                                        <td style={{ padding: "0.625rem 0.75rem" }}>
                                            <span
                                                style={{
                                                    padding: "0.125rem 0.5rem",
                                                    borderRadius: "var(--radius-sm)",
                                                    fontSize: "0.6875rem",
                                                    fontWeight: 600,
                                                    background:
                                                        user.role === "ADMIN" ? "#EFF6FF" : "#F0FDF4",
                                                    color:
                                                        user.role === "ADMIN" ? "#2563EB" : "#16A34A",
                                                }}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.625rem 0.75rem" }}>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    background: user.isActive ? "#16A34A" : "#DC2626",
                                                    marginRight: "0.375rem",
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.625rem 0.75rem",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {user.billCount}
                                        </td>
                                        <td style={{ padding: "0.625rem 0.75rem" }}>
                                            <div style={{ display: "flex", gap: "0.375rem" }}>
                                                <button
                                                    onClick={() => toggleActive(user)}
                                                    disabled={actionId === user.id}
                                                    style={{
                                                        ...btnSmall,
                                                        color: user.isActive
                                                            ? "var(--red-600)"
                                                            : "var(--green-600)",
                                                        background: user.isActive
                                                            ? "var(--red-50)"
                                                            : "#F0FDF4",
                                                    }}
                                                >
                                                    {user.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetTarget(user);
                                                        setNewPassword("");
                                                    }}
                                                    style={btnSmall}
                                                >
                                                    Reset PW
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Reset Password Modal ───────────────────────────── */}
                {resetTarget && (
                    <div
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 50,
                        }}
                        onClick={() => setResetTarget(null)}
                    >
                        <div
                            style={{
                                ...card,
                                padding: "1.5rem",
                                width: "100%",
                                maxWidth: "400px",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3
                                style={{
                                    fontSize: "0.9375rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                Reset Password for {resetTarget.fullName}
                            </h3>
                            <input
                                type="password"
                                style={{ ...inputStyle, marginBottom: "0.75rem" }}
                                placeholder="New password (min 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                            />
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={newPassword.length < 6 || actionId === resetTarget.id}
                                    style={{
                                        ...btnPrimary,
                                        opacity:
                                            newPassword.length < 6 || actionId === resetTarget.id
                                                ? 0.5
                                                : 1,
                                    }}
                                >
                                    {actionId === resetTarget.id ? "Resetting..." : "Reset"}
                                </button>
                                <button
                                    onClick={() => setResetTarget(null)}
                                    style={btnSecondary}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
