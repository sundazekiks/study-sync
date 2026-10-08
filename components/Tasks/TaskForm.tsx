"use client";

import { useActionState, useState } from "react";
import { createTask } from "@/lib/actions/task";

const MAX_ATTACHMENTS = 5;

const ATTACHMENT_ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg";

type ChecklistDraft = {
    id: string;
    title: string;
    description: string;
};

export default function TaskForm() {
    const [state, formAction, isPending] = useActionState(createTask, undefined);
    const [checkList, setCheckList] = useState<ChecklistDraft[]>([]);
    const [attachmentNames, setAttachmentNames] = useState<string[]>([]);

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

    return (
        <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Title
                </label>
                <input
                    id="title"
                    name="title"
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
                    name="description"
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
                    name="dueDate"
                    type="date"
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
                                        name="checkpointTitle"
                                        value={item.title}
                                        onChange={(e) => updateCheckpoint(item.id, "title", e.target.value)}
                                        placeholder="Checkpoint title"
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                                    />
                                    <input
                                        name="checkpointDescription"
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

            <div className="flex flex-col gap-3">
                <label htmlFor="attachments" className="text-sm font-medium text-slate-700">
                    Files
                </label>
                <input
                    id="attachments"
                    name="attachments"
                    type="file"
                    multiple
                    accept={ATTACHMENT_ACCEPT}
                    onChange={(e) =>
                        setAttachmentNames(
                            Array.from(e.target.files ?? []).map((file) => file.name)
                        )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                />
                <p className="text-xs text-slate-400">
                    Attach up to {MAX_ATTACHMENTS} files (PDF, Word, Excel, PowerPoint, ZIP, text, or
                    images), max 10 MB each.
                </p>
                {attachmentNames.length > 0 && (
                    <ul className="flex flex-col gap-1">
                        {attachmentNames.map((name, i) => (
                            <li
                                key={`${name}-${i}`}
                                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                            >
                                <PaperclipIcon />
                                <span className="truncate">{name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

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

function PaperclipIcon() {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0 text-slate-400"
            aria-hidden
        >
            <path d="M13.5 6.5l-4.6 4.6a1.5 1.5 0 002.1 2.1l4.6-4.6a3 3 0 00-4.2-4.2l-5.3 5.3a4.5 3.5 0 106.4 6.4l4-4" />
        </svg>
    );
}