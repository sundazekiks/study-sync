"use server";

import { redirect } from "next/navigation";
import { Task } from "@/lib/schemas/task";
import { auth } from "@/auth";
import { connectDB, User } from "@/lib/mongo";

type CreateTaskInput = {
    title: string;
    description?: string;
    dueDate: string;
    checkList: { title: string; description?: string }[];
};

export async function createTask(input: CreateTaskInput) {
    const session = await auth();
    if (!session?.user) redirect("/login");
    await connectDB();

    if (!input.title.trim()) {
        throw new Error("Title is required");
    }
    const userId = await User.findOne({ email: session.user.email })
    await Task.create({
        userId: userId?._id,
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