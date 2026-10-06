"use client"
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { CourseView } from "@/lib/types";
import SignOutBtn from "../sign-out-btn";
interface CurrentUser {
    id: string;
    email: string;
    displayName: string;
}

interface Course {
    id: string;
    name: string;
    description: string;
    color: string;
    role: "owner" | "moderator" | "member";
    resourceCount: number;
    createdAt: string;
}

export default function CoursePage({ User, Courses }: {
    User: CurrentUser | null,
    Courses: Course[]
}) {

    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<CourseView[] | Course[]>(Courses);
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [form, setForm] = useState({ email: "", displayName: "", password: "" });
    const [newCourse, setNewCourse] = useState({ name: "", description: "" });
    const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [working, setWorking] = useState(false);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setCourses([]);
    }

    // Load Courses for refreshing the page when a course is created or updated
    const loadCourses = useCallback(async () => {
        try {
            const res = await fetch("/api/courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses ?? []);
            }
        } catch {
            setCourses([]);
        }
    }, []);

    // Create a course
    async function handleCreateCourse(e: React.FormEvent) {
        e.preventDefault();
        setNotice(null);
        setWorking(true);
        try {
            const res = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCourse.name, description: newCourse.description }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setNotice({ type: "error", text: data.error ?? "Could not create course." });
                return;
            }
            setNewCourse({ name: "", description: "" });
            await loadCourses();
        } catch {
            setNotice({ type: "error", text: "Network error. Try again." });
        } finally {
            setWorking(false);
        }
    }

    return (<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Welcome back, {user?.displayName}
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</p>
            </div>
            <div className="flex gap-2">
                <SignOutBtn />
                <Link
                    href={`/tasks`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    Tasks
                </Link>
            </div>
        </header>

        {notice && (
            <p
                role="alert"
                className={`rounded-md px-3 py-2 text-sm ${notice.type === "error"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
            >
                {notice.text}
            </p>
        )}

        <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">My courses</h2>
            {courses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    You are not part of any course yet. Create one below to start a course hub.
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {courses.map((course) => (
                        <li key={course.id}>
                            <Link
                                href={`/courses/${course.id}`}
                                className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
                            >
                                <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-white"
                                    style={{ backgroundColor: course.color }}
                                >
                                    {course.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium text-zinc-900 dark:text-zinc-50">
                                        {course.name}
                                    </span>
                                    <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
                                        {course.resourceCount} resource{course.resourceCount === 1 ? "" : "s"}
                                    </span>
                                </span>
                                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    {course.role}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Create a course</h2>
            <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Course name</span>
                    <input
                        type="text"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        required
                        maxLength={80}
                        placeholder="e.g. Biology 101 Study Group"
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Description</span>
                    <textarea
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                        rows={2}
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        placeholder="What is this course about?"
                    />
                </label>
                <button
                    type="submit"
                    disabled={working}
                    className="self-start rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                    {working ? "Creating…" : "Create course"}
                </button>
            </form>
        </section>
    </main>)
}