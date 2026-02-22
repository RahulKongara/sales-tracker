"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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

/* shared input classes */
const INPUT_CLS =
    "w-full px-3 py-2 text-[0.8125rem] border border-border rounded-lg bg-surface text-fg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150";

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
        <div className="min-h-screen bg-surface-secondary">

            <div className="max-w-[900px] mx-auto p-6">
                {/* ── Add User Button ────────────────────────────────── */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 text-[0.8125rem] font-semibold text-white bg-blue-600 border-none rounded-lg
                                   cursor-pointer hover:bg-blue-700 active:scale-[0.98] transition-all duration-150"
                    >
                        {showForm ? "Cancel" : "+ Add Employee"}
                    </button>
                </div>

                {/* ── Add User Form ──────────────────────────────────── */}
                {showForm && (
                    <div className="bg-surface border border-border rounded-lg shadow-sm p-5 mb-6">
                        <h2 className="text-sm font-semibold text-fg mb-4">
                            New Employee
                        </h2>
                        <form onSubmit={handleCreate}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-fg-secondary mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        className={INPUT_CLS}
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fullName: e.target.value })
                                        }
                                        placeholder="e.g. Ravi Kumar"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-fg-secondary mb-1">
                                        Username *
                                    </label>
                                    <input
                                        className={INPUT_CLS}
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData({ ...formData, username: e.target.value })
                                        }
                                        placeholder="e.g. ravi"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-fg-secondary mb-1">
                                        Password *
                                    </label>
                                    <input
                                        className={INPUT_CLS}
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
                                    <label className="block text-xs font-medium text-fg-secondary mb-1">
                                        Role
                                    </label>
                                    <select
                                        className={`${INPUT_CLS} cursor-pointer`}
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
                                <p className="text-red-600 text-xs mb-2">{formError}</p>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 text-[0.8125rem] font-semibold text-white bg-blue-600 border-none rounded-lg
                                           cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                                           hover:bg-blue-700 active:scale-[0.98] transition-all duration-150"
                            >
                                {submitting ? "Creating..." : "Create Employee"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── Users Table ────────────────────────────────────── */}
                <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-fg">
                            All Users ({users.length})
                        </h2>
                        <button
                            onClick={fetchUsers}
                            className="px-2 py-1 text-[0.6875rem] font-medium text-fg-secondary bg-surface-secondary
                                       border border-border rounded-lg cursor-pointer
                                       hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-fg-muted text-sm">
                            Loading...
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-600 text-sm">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[0.8125rem]">
                                <thead>
                                    <tr className="border-b border-border">
                                        {["Name", "Username", "Role", "Status", "Bills", "Actions"].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="px-3 py-2.5 text-left font-semibold text-fg-secondary text-xs uppercase tracking-wider"
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
                                            className={`border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors duration-100
                                                        ${user.isActive ? "" : "opacity-50"}`}
                                        >
                                            <td className="px-3 py-2.5 font-medium text-fg">
                                                {user.fullName}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-fg-secondary">
                                                {user.username}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[0.6875rem] font-semibold
                                                        ${user.role === "ADMIN"
                                                            ? "bg-blue-50 text-blue-600"
                                                            : "bg-green-50 text-green-600"
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5
                                                        ${user.isActive ? "bg-green-600" : "bg-red-600"}`}
                                                />
                                                <span className="text-xs text-fg-secondary">
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-fg-secondary tabular-nums">
                                                {user.billCount}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => toggleActive(user)}
                                                        disabled={actionId === user.id}
                                                        className={`px-2 py-1 text-[0.6875rem] font-medium rounded cursor-pointer border-none
                                                                    transition-colors duration-150
                                                                    ${user.isActive
                                                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                                : "bg-green-50 text-green-600 hover:bg-green-100"
                                                            }`}
                                                    >
                                                        {user.isActive ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setResetTarget(user);
                                                            setNewPassword("");
                                                        }}
                                                        className="px-2 py-1 text-[0.6875rem] font-medium text-fg-secondary bg-surface-secondary
                                                                   border border-border rounded cursor-pointer
                                                                   hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
                                                    >
                                                        Reset PW
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Reset Password Modal ───────────────────────────── */}
                {resetTarget && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={() => setResetTarget(null)}
                    >
                        <div
                            className="bg-surface border border-border rounded-lg shadow-sm p-6 w-full max-w-[400px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-[0.9375rem] font-semibold text-fg mb-3">
                                Reset Password for {resetTarget.fullName}
                            </h3>
                            <input
                                type="password"
                                className={`${INPUT_CLS} mb-3`}
                                placeholder="New password (min 6 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleResetPassword}
                                    disabled={newPassword.length < 6 || actionId === resetTarget.id}
                                    className="px-4 py-2 text-[0.8125rem] font-semibold text-white bg-blue-600 border-none rounded-lg
                                               cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                                               hover:bg-blue-700 transition-all duration-150"
                                >
                                    {actionId === resetTarget.id ? "Resetting..." : "Reset"}
                                </button>
                                <button
                                    onClick={() => setResetTarget(null)}
                                    className="px-3 py-2 text-[0.8125rem] font-medium text-fg-secondary bg-surface-secondary
                                               border border-border rounded-lg cursor-pointer
                                               hover:bg-surface-tertiary hover:text-fg transition-colors duration-150"
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
