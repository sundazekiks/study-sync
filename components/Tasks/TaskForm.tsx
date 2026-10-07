"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions/task";

type ChecklistDraft = {
    id: string;
    title: string;
    description: string;
};

export default function TaskForm() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [checkList, setCheckList] = useState<ChecklistDraft[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function addCheckpoint() {
        setCheckList((prev) => [
            ...prev,
            { id: crypto.randomUUID(), title: "", description: "" },
        ]);
    }

    function updateCheckpoint(id: string, field: "title" | "description", value: string) {
        setCheckList((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    }

    function removeCheckpoint(id: string) {
        setCheckList((prev) => prev.filter((item) => item.id !== id));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Give the task a title.");
            return;
        }
        if (!dueDate) {
            setError("Pick a due date.");
            return;
        }

        startTransition(async () => {
            try {
                await createTask({
                    title,
                    description,
                    dueDate,
                    checkList: checkList.map(({ title, description }) => ({ title, description })),
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't create the task.");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Title
                </label>
                <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Finish problem set 4"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Any context worth remembering later"
                    className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="dueDate" className="text-sm font-medium text-slate-700">
                    Due date
                </label>
                <input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-fit rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Checkpoints</span>
                    <button
                        type="button"
                        onClick={addCheckpoint}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                        Add checkpoint
                    </button>
                </div>

                {checkList.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                        No checkpoints yet. Break the task down if it helps.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {checkList.map((item, i) => (
                            <div key={item.id} className="flex items-start gap-2">
                                <span className="mt-2.5 text-xs text-slate-400">{i + 1}.</span>
                                <div className="flex flex-1 flex-col gap-2">
                                    <input
                                        value={item.title}
                                        onChange={(e) => updateCheckpoint(item.id, "title", e.target.value)}
                                        placeholder="Checkpoint title"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <input
                                        value={item.description}
                                        onChange={(e) => updateCheckpoint(item.id, "description", e.target.value)}
                                        placeholder="Notes (optional)"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCheckpoint(item.id)}
                                    className="mt-1.5 shrink-0 text-sm text-slate-400 hover:text-red-500"
                                    aria-label="Remove checkpoint"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? "Creating..." : "Create task"}
                </button>
            </div>
        </form>
    );
}