import { TaskDoc } from "@/lib/schemas/task";



export default function TaskCard({ props }: { props: TaskDoc }) {
    const total = props.checkList.length;
    const done = props.checkList.filter((item) => item.complete).length;

    return (
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg font-semibold leading-snug text-slate-900">
                    {props.title}
                </h1>
                {total > 0 && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {done}/{total}
                    </span>
                )}
            </div>

            {/* Description */}
            {props.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {props.description}
                </p>
            )}

            {/* Progress bar */}
            {total > 0 && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-300"
                        style={{ width: `${(done / total) * 100}%` }}
                    />
                </div>
            )}

            {/* Checklist */}
            <div className="mt-4 flex flex-col gap-2">
                {total !== 0 ? (
                    props.checkList.map((item, index) => (
                        <label
                            key={index}
                            className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50"
                        >
                            <input
                                type="checkbox"
                                defaultChecked={item.complete!}
                                className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-slate-300 bg-white checked:border-teal-500 checked:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                            />
                            <span className="text-sm text-slate-700 peer-checked:text-slate-400 peer-checked:line-through">
                                {item.title}
                            </span>
                        </label>
                    ))
                ) : (
                    <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                        No checkpoints provided
                    </p>
                )}
            </div>

            {/* Footer */}
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Created{" "}
                {props.createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })}
            </p>
        </div>
    );
}