"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { TaskStatus, TaskSummary, TaskView } from "@/lib/types";

const STATUSES: TaskStatus[] = ["not-started", "in-progress", "completed"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  "not-started": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const EMPTY_SUMMARY: TaskSummary = {
  total: 0,
  notStarted: 0,
  inProgress: 0,
  completed: 0,
};

interface TaskFormState {
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
}

const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
  assigneeId: "",
};

interface Props {
  courseId: string;
  members: { userId: string; displayName: string }[];
}

function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function TasksSection({ courseId, members }: Props) {
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [summary, setSummary] = useState<TaskSummary>(EMPTY_SUMMARY);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    assignee: "all",
    dueFrom: "",
    dueTo: "",
  });
  const [form, setForm] = useState<TaskFormState>(EMPTY_TASK_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/tasks`);
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTasks(data.tasks ?? []);
        setSummary(data.summary ?? EMPTY_SUMMARY);
      } else {
        setNotice({ type: "error", text: data.error ?? "Could not load tasks." });
      }
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    }
  }, [courseId, router]);

  useEffect(() => {
    let ignore = false;
    async function initialize() {
      await load();
      if (ignore) return;
      setLoaded(true);
    }
    void initialize();
    return () => {
      ignore = true;
    };
  }, [load]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not add task." });
        return;
      }
      setForm(EMPTY_TASK_FORM);
      setNotice({ type: "success", text: "Task added to the course." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  function startEditTask(task: TaskView) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      assigneeId: task.assignee?.id ?? "",
    });
  }

  async function handleSaveTaskEdit(task: TaskView) {
    if (!editForm) return;
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, updatedAt: task.updatedAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not save changes." });
        if (res.status === 409) await load();
        return;
      }
      setEditingId(null);
      setEditForm(null);
      setNotice({ type: "success", text: "Task updated." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  async function handleDeleteTask(task: TaskView) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not delete task." });
        return;
      }
      setNotice({ type: "success", text: "Task deleted." });
      await load();
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  async function handleStatusChange(task: TaskView, status: TaskStatus) {
    setNotice(null);
    setWorking(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, updatedAt: task.updatedAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Could not update status." });
        if (res.status === 409) await load();
        return;
      }
      if (data.summary) setSummary(data.summary);
      if (data.task) {
        setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
      }
    } catch {
      setNotice({ type: "error", text: "Network error. Try again." });
    } finally {
      setWorking(false);
    }
  }

  const visibleTasks = tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.assignee === "unassigned" && task.assignee) return false;
    if (
      filters.assignee !== "all" &&
      filters.assignee !== "unassigned" &&
      task.assignee?.id !== filters.assignee
    ) {
      return false;
    }
    if (filters.dueFrom && (!task.dueDate || task.dueDate < filters.dueFrom)) return false;
    if (filters.dueTo && (!task.dueDate || task.dueDate > filters.dueTo)) return false;
    return true;
  });

  const filtersActive =
    filters.status !== "all" ||
    filters.assignee !== "all" ||
    filters.dueFrom !== "" ||
    filters.dueTo !== "";

  const percent = (value: number) =>
    summary.total === 0 ? 0 : Math.round((value / summary.total) * 100);

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
  const smallInputClass =
    "rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Course tasks</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {summary.completed} of {summary.total} complete
        </span>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="flex h-full w-full">
            <span
              className="bg-emerald-500 transition-all"
              style={{ width: `${percent(summary.completed)}%` }}
            />
            <span
              className="bg-amber-500 transition-all"
              style={{ width: `${percent(summary.inProgress)}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{summary.notStarted} not started</span>
          <span>{summary.inProgress} in progress</span>
          <span>{summary.completed} completed</span>
          <span>{summary.total} total</span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={smallInputClass}
          >
            <option value="all">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Assignee
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            className={smallInputClass}
          >
            <option value="all">All</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Due from
          <input
            type="date"
            value={filters.dueFrom}
            onChange={(e) => setFilters({ ...filters, dueFrom: e.target.value })}
            className={smallInputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Due to
          <input
            type="date"
            value={filters.dueTo}
            onChange={(e) => setFilters({ ...filters, dueTo: e.target.value })}
            className={smallInputClass}
          />
        </label>
        {filtersActive && (
          <button
            type="button"
            onClick={() => setFilters({ status: "all", assignee: "all", dueFrom: "", dueTo: "" })}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        )}
      </div>

      <form
        onSubmit={handleAddTask}
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-1">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Task title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              required
              maxLength={120}
              placeholder="e.g. Summarize lecture 5"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Due date</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Assignee</span>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className={inputClass}
            placeholder="Optional details"
          />
        </label>
        <button
          type="submit"
          disabled={working}
          className="self-start rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {working ? "Adding…" : "Add task"}
        </button>
      </form>

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

      {!loaded ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No tasks yet. Add the first task above so everyone can see what is left to do.
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No tasks match these filters.{" "}
          <button
            type="button"
            onClick={() => setFilters({ status: "all", assignee: "all", dueFrom: "", dueTo: "" })}
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear filters
          </button>{" "}
          to see all {tasks.length} tasks.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleTasks.map((task) => {
            const overdue =
              task.dueDate !== "" && task.dueDate < todayISO() && task.status !== "completed";
            return (
              <li
                key={task.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {editingId === task.id && editForm ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSaveTaskEdit(task);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Title</span>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className={inputClass}
                        required
                        maxLength={120}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Description
                      </span>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        className={inputClass}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Due date
                        </span>
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className={inputClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          Assignee
                        </span>
                        <select
                          value={editForm.assigneeId}
                          onChange={(e) =>
                            setEditForm({ ...editForm, assigneeId: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.displayName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={working}
                        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditForm(null);
                        }}
                        className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
                            task.status === "completed"
                              ? "bg-emerald-500"
                              : task.status === "in-progress"
                                ? "bg-amber-500"
                                : "bg-zinc-300 dark:bg-zinc-600"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <h3
                            className={`font-medium ${
                              task.status === "completed"
                                ? "text-zinc-400 line-through dark:text-zinc-500"
                                : "text-zinc-900 dark:text-zinc-50"
                            }`}
                          >
                            {task.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}
                            >
                              {STATUS_LABEL[task.status]}
                            </span>
                            {task.dueDate ? (
                              <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
                                {overdue ? "Overdue · " : "Due "}
                                {formatDueDate(task.dueDate)}
                              </span>
                            ) : (
                              <span>No due date</span>
                            )}
                            <span>
                              {task.assignee ? `Assigned to ${task.assignee.displayName}` : "Unassigned"}
                            </span>
                            <span>Added by {task.creator.displayName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {task.canProgress ? (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              void handleStatusChange(task, e.target.value as TaskStatus)
                            }
                            disabled={working}
                            aria-label={`Change status of ${task.title}`}
                            className={smallInputClass}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}
                          >
                            {STATUS_LABEL[task.status]}
                          </span>
                        )}
                        {task.canEdit && (
                          <button
                            type="button"
                            onClick={() => startEditTask(task)}
                            className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                        )}
                        {task.canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTask(task)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{task.description}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}