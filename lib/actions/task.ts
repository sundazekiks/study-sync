"use server";

import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Task } from "@/lib/schemas/task";

type CreateTaskInput = {
    title: string;
    description?: string;
    dueDate: string;
    checkList: { title: string; description?: string }[];
};

export async function createTask(input: CreateTaskInput) {
    const session = await getSessionUser();
    if (!session) redirect("/");

    if (!input.title.trim()) {
        throw new Error("Title is required");
    }

    await Task.create({
        userId: session.id,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        dueDate: input.dueDate,
        checkList: input.checkList
            .filter((item) => item.title.trim())
            .map((item) => ({
                title: item.title.trim(),
                description: item.description?.trim(),
                complete: false,
            })),
    });

    redirect("/tasks");
}