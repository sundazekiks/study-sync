import { getSessionUser } from "@/lib/auth";
import { RedirectType, redirect } from "next/navigation";
import TaskForm from "@/components/Tasks/TaskForm";

export default async function NewTaskPage() {
    const session = await getSessionUser();
    if (!session) redirect("/", RedirectType.push);

    return (
        <div className="mx-auto max-w-2xl px-6 py-10">
            <div className="mb-8 border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-semibold text-slate-900">New task</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Add the details and any checkpoints you want to track.
                </p>
            </div>
            <TaskForm />
        </div>
    );
}