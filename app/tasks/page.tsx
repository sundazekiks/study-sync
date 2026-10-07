import { RedirectType, redirect } from "next/navigation";
import { Task } from "@/lib/schemas/task";
import TaskList from "@/components/Tasks/TaskList";
import Link from "next/link";
import { auth } from "@/auth";
import { connectDB, User } from "@/lib/mongo";


export default async function Page() {
    const session = await auth();
    if (!session?.user) redirect("/", RedirectType.push);
    await connectDB();
    const userId = await User.findOne({ email: session.user.email })
    const tasks = await Task.find({ userId: userId?._id }).sort({ dueDate: 1 });

    const now = new Date();
    const overdue = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const allDone = t.checkList.length > 0 && t.checkList.every((i) => i.complete);
        return new Date(t.dueDate) < now && !allDone;
    }).length;

    const summary =
        tasks.length === 0
            ? "Nothing on your list right now."
            : overdue > 0
                ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}, ${overdue} overdue.`
                : `${tasks.length} task${tasks.length === 1 ? "" : "s"}, all on track.`;

    return (
        <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
                    <p className="mt-1 text-sm text-slate-500">{summary}</p>
                </div>
                <Link
                    href="/tasks/new"
                    className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                    New task
                </Link>
            </div>

            <TaskList props={tasks} />
        </div>
    );
}