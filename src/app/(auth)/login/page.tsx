"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password) {
            setError("Please enter both username and password");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn("credentials", {
                username: username.trim(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid username or password");
                setLoading(false);
                return;
            }

            // Redirect on success
            router.push(callbackUrl || "/bills/new");
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                background: "var(--bg-secondary)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "var(--radius-lg)",
                            background: "var(--green-500)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 1rem",
                            fontSize: "1.5rem",
                        }}
                    >
                        💊
                    </div>
                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                            marginBottom: "0.5rem",
                        }}
                    >
                        Pharmacy Dashboard
                    </h1>
                    <p
                        style={{
                            fontSize: "0.875rem",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Sign in to manage bills & view analytics
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-md)",
                        padding: "1.5rem",
                    }}
                >
                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                background: "var(--red-50)",
                                border: "1px solid var(--red-500)",
                                borderRadius: "var(--radius)",
                                padding: "0.75rem 1rem",
                                marginBottom: "1rem",
                                fontSize: "0.8125rem",
                                color: "var(--red-600)",
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Username */}
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            htmlFor="username"
                            style={{
                                display: "block",
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                marginBottom: "0.375rem",
                            }}
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            placeholder="Enter your username"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "0.625rem 0.75rem",
                                fontSize: "0.875rem",
                                border: "1px solid var(--border-default)",
                                borderRadius: "var(--radius)",
                                background: "var(--bg-primary)",
                                color: "var(--text-primary)",
                                outline: "none",
                                transition: "border-color 0.15s ease",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) =>
                                (e.target.style.borderColor = "var(--blue-500)")
                            }
                            onBlur={(e) =>
                                (e.target.style.borderColor = "var(--border-default)")
                            }
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: "1.25rem" }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: "block",
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                marginBottom: "0.375rem",
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "0.625rem 0.75rem",
                                fontSize: "0.875rem",
                                border: "1px solid var(--border-default)",
                                borderRadius: "var(--radius)",
                                background: "var(--bg-primary)",
                                color: "var(--text-primary)",
                                outline: "none",
                                transition: "border-color 0.15s ease",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) =>
                                (e.target.style.borderColor = "var(--blue-500)")
                            }
                            onBlur={(e) =>
                                (e.target.style.borderColor = "var(--border-default)")
                            }
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "0.625rem",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--white)",
                            background: loading ? "var(--gray-400)" : "var(--green-500)",
                            border: "none",
                            borderRadius: "var(--radius)",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                            if (!loading)
                                (e.target as HTMLButtonElement).style.background =
                                    "var(--green-600)";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading)
                                (e.target as HTMLButtonElement).style.background =
                                    "var(--green-500)";
                        }}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/* Footer */}
                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "1.5rem",
                    }}
                >
                    Pharmacy Sales Dashboard v1.0
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
