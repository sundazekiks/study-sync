import mongoose from "mongoose";
import { connectDB } from "../mongo";
import { Task } from "../schemas/task";

export async function seedTasks() {
    try {
        await connectDB();

        const tasks = await Task.find({});
        console.log(tasks)
        return tasks;
    } finally {
        await mongoose.disconnect();
    }
}
seedTasks()