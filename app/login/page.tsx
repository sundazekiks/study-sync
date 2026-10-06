"use client";

import { useActionState } from "react";
import { UserSignIn } from "@/action";

export default function SignInForm() {
    const [state, formAction, isPending] = useActionState(UserSignIn, undefined);

    return (
        <form
            action={formAction}
            className="mx-auto flex w-full max-w-sm flex-col gap-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
        >
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
                <p className="text-sm text-gray-500">Sign in to continue to StudySync</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            {state?.error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                    {state.error}
                </p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}