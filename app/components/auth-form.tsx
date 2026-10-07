"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "signup" | "login";
}

function readNextParam(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("next");
  return value && value.startsWith("/") ? value : null;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWorking(true);
    try {
      const res = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { displayName, email, password } : { email, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      const next = readNextParam();
      router.replace(next ?? "/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {isSignup
            ? "Sign up to start organizing study groups."
            : "Log in to continue to your dashboard."}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {isSignup && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                required
                maxLength={60}
                autoComplete="name"
                placeholder="e.g. Alex Johnson"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              required
              autoComplete="email"
              placeholder="student@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
            />
          </label>
          <button
            type="submit"
            disabled={working}
            className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {working
              ? isSignup
                ? "Creating account…"
                : "Logging in…"
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New to StudySync?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to the landing page
          </Link>
        </p>
      </div>
    </main>
  );
}
