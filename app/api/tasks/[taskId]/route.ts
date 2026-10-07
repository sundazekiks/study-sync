import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB, Task as TaskModel } from "@/lib/mongo";
import { canManageTask, isMember } from "@/lib/permissions";
import {
  displayNames,
  loadTaskContext,
  recomputeTaskSummary,
  toTaskView,
} from "@/lib/tasks";
import { isTaskStatus, validateTaskFields } from "@/lib/validators";

function conflictOrCurrent(taskUpdatedAt: string, requested?: string) {
  if (requested !== undefined && requested !== taskUpdatedAt) {
    return NextResponse.json(
      { error: "This task changed since you loaded it. Refresh and try again." },
      { status: 409 }
    );
  }
  return null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/tasks/[taskId]">) {
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

  const names = await displayNames([task.createdById, task.assigneeId]);
  return NextResponse.json({ task: toTaskView(task, names, course, user.id) });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/tasks/[taskId]">) {
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
  if (!canManageTask(course, task, user.id)) {
    return NextResponse.json(
      { error: "Only the task creator or a course moderator can edit this task." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = (body ?? {}) as {
    title?: string;
    description?: string;
    dueDate?: string;
    assigneeId?: string;
    status?: string;
    updatedAt?: string;
  };

  const conflict = conflictOrCurrent(task.updatedAt, parsed.updatedAt);
  if (conflict) return conflict;

  const title = parsed.title !== undefined ? String(parsed.title).trim() : task.title;
  const description =
    parsed.description !== undefined ? String(parsed.description).trim() : task.description;
  const dueDate = parsed.dueDate !== undefined ? String(parsed.dueDate).trim() : task.dueDate;
  const assigneeId =
    parsed.assigneeId !== undefined ? String(parsed.assigneeId).trim() : task.assigneeId;
  const status = parsed.status !== undefined ? String(parsed.status) : task.status;

  const errors = validateTaskFields({ title, description, dueDate });
  if (!isTaskStatus(status)) {
    errors.push("Status must be one of: not-started, in-progress, completed.");
  }
  if (assigneeId && !course.members.some((m) => m.userId === assigneeId)) {
    errors.push("Assignee must be a member of this course.");
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  await connectDB();
  await TaskModel.updateOne(
    { _id: taskId },
    {
      title,
      description,
      dueDate,
      assigneeId,
      status,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    }
  );

  const summary = await recomputeTaskSummary(course.id);
  const { task: updated } = await loadTaskContext(taskId);
  if (!updated) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  const names = await displayNames([updated.createdById, updated.assigneeId]);
  return NextResponse.json({ task: toTaskView(updated, names, course, user.id), summary });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/tasks/[taskId]">) {
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
  if (!canManageTask(course, task, user.id)) {
    return NextResponse.json(
      { error: "Only the task creator or a course moderator can delete this task." },
      { status: 403 }
    );
  }

  await connectDB();
  await TaskModel.deleteOne({ _id: taskId });
  const summary = await recomputeTaskSummary(course.id);

  return NextResponse.json({ ok: true, summary });
}