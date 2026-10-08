"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserSignUp } from "@/action";
import GitHubSignInBtn from "@/components/github-login";

export default function SignUpForm() {
    const [state, formAction, isPending] = useActionState(UserSignUp, undefined);

    return (
        <main className="flex flex-1 items-center justify-center px-6 py-16">
            <section className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
                <header className="space-y-1.5 text-center">
                    <Link
                        href="/"
                        className="mx-auto mb-2 flex w-fit items-center gap-2"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                            S
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
                            StudySync
                        </span>
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
                        Create your account
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Start your first study group in minutes
                    </p>
                </header>

                <form action={formAction} className="flex flex-col gap-5">
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-gray-700 dark:text-zinc-300">Display name</span>
                        <input
                            type="text"
                            name="displayName"
                            placeholder="Ada Lovelace"
                            required
                            autoComplete="name"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-gray-700 dark:text-zinc-300">Email</span>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-gray-700 dark:text-zinc-300">Password</span>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        />
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                            At least 8 characters.
                        </span>
                    </label>

                    {state?.error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                            {state.error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
                    <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
                    or
                    <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
                </div>

                <GitHubSignInBtn />

                <p className="text-center text-sm text-gray-500 dark:text-zinc-400">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Sign in
                    </Link>
                </p>
            </section>
        </main>
    );
}