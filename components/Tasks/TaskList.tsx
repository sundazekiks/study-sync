import { TaskDoc } from "@/lib/schemas/task";
import TaskCard from "./TaskCard";

export default function TaskList({ props }: { props: Array<TaskDoc> }) {
    if (props.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <p className="text-sm font-medium text-slate-700">No tasks yet</p>
                <p className="text-sm text-slate-400">Add one to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {props.map((task) => (
                <TaskCard key={task._id.toString()} props={task} /> // fix the key id later on
            ))}
        </div>
    );
}