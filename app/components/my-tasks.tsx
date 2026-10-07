import Link from "next/link";

import { listTasksAssignedTo } from "@/lib/tasks";

function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

export default async function MyTasks({ userId }: { userId: string }) {
  const tasks = await listTasksAssignedTo(userId);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">My tasks</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {tasks.length === 0 ? "" : `${tasks.length} assigned to you`}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Nothing assigned to you. Open a course to create tasks or assign one to yourself.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => {
            const overdue =
              task.dueDate !== "" && task.dueDate < todayISO() && task.status !== "completed";
            return (
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
                    <span
                      className={`block truncate text-sm font-medium ${
                        task.status === "completed"
                          ? "text-zinc-400 line-through dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-50"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {task.courseName}
                      {task.dueDate
                        ? ` · ${overdue ? "Overdue · " : "Due "}${formatDueDate(task.dueDate)}`
                        : " · No due date"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : task.status === "in-progress"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}