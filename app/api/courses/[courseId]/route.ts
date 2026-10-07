import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import {
  connectDB,
  Course as CourseModel,
  Resource as ResourceModel,
  Task as TaskModel,
  toCourse,
  User as UserModel,
} from "@/lib/mongo";
import { getRole, requireMember } from "@/lib/permissions";
import { deleteUpload } from "@/lib/uploads";
import { validateCourseFields } from "@/lib/validators";

export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[courseId]">) {
  const { courseId } = await ctx.params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  const membership = await requireMember(course, user.id);
  if (!membership.ok) {
    return NextResponse.json({ error: membership.error }, { status: membership.status });
  }

  const memberIds = course.members.map((m) => m.userId);
  const userDocs = await UserModel.find({ _id: { $in: memberIds } }).lean();
  const nameById = new Map(userDocs.map((u) => [u._id, u.displayName]));

  const members = course.members.map((m) => ({
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    displayName: nameById.get(m.userId) ?? "Unknown",
  }));

  const resourceCount = await ResourceModel.countDocuments({ courseId: course.id });

  return NextResponse.json({
    course: {
      id: course.id,
      name: course.name,
      description: course.description,
      color: course.color,
      ownerId: course.ownerId,
      createdAt: course.createdAt,
      myRole: course.members.find((m) => m.userId === user.id)?.role ?? null,
      members,
      resourceCount,
      taskSummary: course.taskSummary,
    },
  });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/courses/[courseId]">) {
  const { courseId } = await ctx.params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  const membership = await requireMember(course, user.id);
  if (!membership.ok) {
    return NextResponse.json({ error: membership.error }, { status: membership.status });
  }
  if (getRole(course, user.id) !== "owner") {
    return NextResponse.json(
      { error: "Only the course owner can update course information." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = (body ?? {}) as { name?: string; description?: string; color?: string };

  const name = parsed.name !== undefined ? String(parsed.name).trim() : course.name;
  const description =
    parsed.description !== undefined ? String(parsed.description).trim() : course.description;

  const errors = validateCourseFields({ name, description });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const update: Record<string, unknown> = { name, description };
  if (parsed.color !== undefined) {
    const color = String(parsed.color).trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Color must be a hex value like #6366f1." },
        { status: 400 }
      );
    }
    update.color = color.toLowerCase();
  }

  await CourseModel.updateOne({ _id: courseId }, update);
  const updated = await CourseModel.findById(courseId).lean();
  if (!updated) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  return NextResponse.json({ course: toCourse(updated) });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/courses/[courseId]">) {
  const { courseId } = await ctx.params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  const membership = await requireMember(course, user.id);
  if (!membership.ok) {
    return NextResponse.json({ error: membership.error }, { status: membership.status });
  }
  if (getRole(course, user.id) !== "owner") {
    return NextResponse.json(
      { error: "Only the course owner can delete this course." },
      { status: 403 }
    );
  }

  const resources = await ResourceModel.find({ courseId }).lean();
  for (const resource of resources) {
    if (resource.type === "file" && resource.location) {
      await deleteUpload(resource.location);
    }
  }

  await ResourceModel.deleteMany({ courseId });
  await TaskModel.deleteMany({ courseId });
  await CourseModel.deleteOne({ _id: courseId });

  return NextResponse.json({ ok: true });
}