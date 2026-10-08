"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserSignIn } from "@/action";
import GitHubSignInBtn from "@/components/github-login";
export default function SignInForm() {
    const [state, formAction, isPending] = useActionState(UserSignIn, undefined);
    return (
        <section className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/60">
            <header className="space-y-1.5 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                    Welcome back
                </h1>
                <p className="text-sm text-gray-500">Sign in to continue to StudySync</p>
            </header>

            <form action={formAction} className="flex flex-col gap-5">
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
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 te   xt-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
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
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                    />
                </div>

                {state?.error && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    >
                        {state.error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                or
                <span className="h-px flex-1 bg-gray-200" />
            </div>

            <GitHubSignInBtn />

            <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Create one
                </Link>
            </p>
        </section>
    );
}