import { connectDB } from "../mongo";
import { Task } from "../schemas/task";

export async function seedTasks() {
    try {
        await connectDB();
        const createTasks = await Task.find({ userId: 'usr_c66785e8-da6e-42a3-a92f-23e9e14654a4' })
        console.log(createTasks);
    } catch (err) {
        console.error(err)
    }
}

