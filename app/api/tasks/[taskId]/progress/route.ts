import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB, Task as TaskModel } from "@/lib/mongo";
import { canUpdateTaskProgress, isMember } from "@/lib/permissions";
import { displayNames, loadTaskContext, recomputeTaskSummary, toTaskView } from "@/lib/tasks";
import { isTaskStatus } from "@/lib/validators";

export async function PATCH(req: Request, ctx: RouteContext<"/api/tasks/[taskId]/progress">) {
  const { taskId } = await ctx.params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { task, course } = await loadTaskContext(taskId);
  if (!task || !course) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }
  if (!canUpdateTaskProgress(course, task, user.id)) {
    return NextResponse.json(
      { error: "Only the task creator, its assignee, or a course moderator can change progress." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = (body ?? {}) as { status?: string; updatedAt?: string };

  if (parsed.updatedAt !== undefined && parsed.updatedAt !== task.updatedAt) {
    return NextResponse.json(
      { error: "This task changed since you loaded it. Refresh and try again." },
      { status: 409 }
    );
  }

  const status = String(parsed.status ?? "").trim();
  if (!isTaskStatus(status)) {
    return NextResponse.json(
      { error: "Status must be one of: not-started, in-progress, completed." },
      { status: 400 }
    );
  }

  await connectDB();
  await TaskModel.updateOne(
    { _id: taskId },
    { status, updatedById: user.id, updatedAt: new Date().toISOString() }
  );

  const summary = await recomputeTaskSummary(course.id);
  const { task: updated } = await loadTaskContext(taskId);
  if (!updated) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  const names = await displayNames([updated.createdById, updated.assigneeId]);
  return NextResponse.json({ task: toTaskView(updated, names, course, user.id), summary });
}