"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import type { DashboardStats } from "@/lib/dashboard";
import type { CourseView } from "@/lib/types";

interface DashboardProps {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  courses: CourseView[];
  stats: DashboardStats;
  headerAction?: ReactNode;
  myTasks: ReactNode;
}

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard({
  user,
  courses: initialCourses,
  stats,
  headerAction,
  myTasks,
}: DashboardProps) {
  const [courses, setCourses] = useState<CourseView[]>(initialCourses);
  const [newCourse, setNewCourse] = useState({ name: "", description: "" });
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [working, setWorking] = useState(false);
  const courseFormRef = useRef<HTMLDivElement>(null);

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

  function focusCourseForm() {
    courseFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    courseFormRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
        </div>
        {headerAction}
      </header>

      {notice && (
        <p
          role="alert"
          className={`rounded-md px-3 py-2 text-sm ${
            notice.type === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Courses
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.courseCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Active tasks
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.activeTasks}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Completed
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.completedTasks}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Progress
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {stats.progressPercent}%
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Overall task progress
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {stats.completedTasks} of {stats.totalTasks} assigned tasks done
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={focusCourseForm}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
        >
          + New course
        </button>
        {courses.length > 0 ? (
          <Link
            href={`/courses/${courses[0].id}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            + New task
          </Link>
        ) : (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Create a course first to add tasks.
          </span>
        )}
      </section>

      {stats.upcomingTasks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming tasks
          </h2>
          <ul className="flex flex-col gap-2">
            {stats.upcomingTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/courses/${task.courseId}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
                >
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: task.courseColor }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {task.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {task.courseName}
                      {task.dueDate ? ` · Due ${formatDueDate(task.dueDate)}` : " · No due date"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.status === "in-progress"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
                      {course.taskSummary.completed}/{course.taskSummary.total} tasks done
                      {" · "}
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

      {myTasks}

      <section
        ref={courseFormRef}
        className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
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
    </main>
  );
}
