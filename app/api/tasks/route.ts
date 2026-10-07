import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB, Course as CourseModel, newId, Task as TaskModel, toCourse } from "@/lib/mongo";
import { isMember } from "@/lib/permissions";
import {
  displayNames,
  listTasksForUser,
  parseTaskFilters,
  recomputeTaskSummary,
  toTaskView,
} from "@/lib/tasks";
import type { TaskDocLean } from "@/lib/mongo";
import { validateTaskFields } from "@/lib/validators";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const { filters, error } = parseTaskFilters(params, user.id);
  if (error || !filters) {
    return NextResponse.json({ error: error ?? "Invalid filters." }, { status: 400 });
  }

  const courseId = params.get("courseId") ?? undefined;
  const status = params.get("status") ?? undefined;
  const assignee = params.get("assignee") ?? undefined;
  const limitRaw = Number(params.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

  const result = await listTasksForUser(user.id, { courseId, status, assignee, limit });
  return NextResponse.json({ tasks: result.tasks, matches: result.matches });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = (body ?? {}) as {
    courseId?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    assigneeId?: string;
  };

  const courseId = String(parsed.courseId ?? "").trim();
  if (!courseId) {
    return NextResponse.json({ error: "A courseId is required." }, { status: 400 });
  }

  await connectDB();
  const courseDoc = await CourseModel.findById(courseId).lean();
  if (!courseDoc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(courseDoc);
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }

  const title = String(parsed.title ?? "").trim();
  const description = String(parsed.description ?? "").trim();
  const dueDate = String(parsed.dueDate ?? "").trim();
  const assigneeId = String(parsed.assigneeId ?? "").trim();

  const errors = validateTaskFields({ title, description, dueDate });
  if (assigneeId && !course.members.some((m) => m.userId === assigneeId)) {
    errors.push("Assignee must be a member of this course.");
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const normalized = title.toLocaleLowerCase();
  const existing = await TaskModel.find({ courseId }).lean();
  const duplicate = existing.find((t) => t.title.trim().toLocaleLowerCase() === normalized);
  if (duplicate) {
    return NextResponse.json(
      { error: `A task titled "${duplicate.title}" already exists in this course.` },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const doc = await TaskModel.create({
    _id: newId("tsk"),
    courseId,
    title,
    description,
    dueDate,
    assigneeId,
    status: "not-started",
    createdById: user.id,
    createdAt: now,
    updatedById: user.id,
    updatedAt: now,
  });

  const names = await displayNames([user.id, assigneeId]);
  const summary = await recomputeTaskSummary(courseId);

  return NextResponse.json(
    {
      task: toTaskView(doc.toObject() as TaskDocLean, names, course, user.id),
      summary,
    },
    { status: 201 }
  );
}
