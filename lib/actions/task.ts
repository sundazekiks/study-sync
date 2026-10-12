"use server";

import { redirect } from "next/navigation";
import { Task } from "@/lib/schemas/task";
import { auth } from "@/auth";
import { connectDB, User } from "@/lib/mongo";
import { saveUpload } from "@/lib/uploads";
import { MAX_TASK_ATTACHMENTS, validateUploadedFile } from "@/lib/validators";

export type CreateTaskState = { error?: string } | undefined;

export async function createTask(
    prevState: CreateTaskState,
    formData: FormData
): Promise<CreateTaskState> {
    const session = await auth();
    if (!session?.user) redirect("/login");
    await connectDB();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();

    if (!title) {
        return { error: "Give the task a title." };
    }
    if (!dueDate) {
        return { error: "Pick a due date." };
    }

    const checkpointTitles = formData.getAll("checkpointTitle").map((value) => String(value));
    const checkpointDescriptions = formData
        .getAll("checkpointDescription")
        .map((value) => String(value));

    const checkList = checkpointTitles
        .map((checkpointTitle, index) => ({
            title: checkpointTitle.trim(),
            description: checkpointDescriptions[index]?.trim(),
        }))
        .filter((item) => item.title)
        .map((item) => ({
            title: item.title,
            description: item.description,
            complete: false,
        }));

    const files = formData
        .getAll("attachments")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length > MAX_TASK_ATTACHMENTS) {
        return { error: `You can attach up to ${MAX_TASK_ATTACHMENTS} files per task.` };
    }

    for (const file of files) {
        const check = validateUploadedFile(file);
        if (!check.ok) {
            return { error: check.error };
        }
    }

    const attachments = [];
    for (const file of files) {
        const saved = await saveUpload(file);
        attachments.push({
            fileId: saved.fileId,
            name: file.name || "file",
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            uploadedAt: new Date().toISOString(),
        });
    }

    const user = await User.findOne({ email: session.user.email });

    await Task.create({
        userId: user?._id,
        title,
        description: description || undefined,
        dueDate,
        checkList,
        attachments,
    });

    redirect("/tasks");
}