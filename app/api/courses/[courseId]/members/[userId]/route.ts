import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { connectDB, Course as CourseModel, toCourse } from "@/lib/mongo";
import { getRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "moderator", "member"];

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/courses/[courseId]/members/[userId]">
) {
  const { courseId, userId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { role } = (body ?? {}) as { role?: string };
  if (!role || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Role must be owner, moderator, or member." }, { status: 400 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  if (getRole(course, user.id) !== "owner") {
    return NextResponse.json({ error: "Only the course owner can manage members." }, { status: 403 });
  }

  const target = course.members.find((m) => m.userId === userId);
  if (!target) {
    return NextResponse.json({ error: "That student is not a member of this course." }, { status: 404 });
  }
  if (userId === course.ownerId && role !== "owner") {
    return NextResponse.json(
      { error: "The course owner cannot be demoted." },
      { status: 400 }
    );
  }

  await CourseModel.updateOne(
    { _id: courseId, "members.userId": userId },
    { $set: { "members.$.role": role as Role } }
  );

  return NextResponse.json({ member: { userId, role } });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/courses/[courseId]/members/[userId]">
) {
  const { courseId, userId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  if (getRole(course, user.id) !== "owner") {
    return NextResponse.json({ error: "Only the course owner can manage members." }, { status: 403 });
  }
  if (userId === course.ownerId) {
    return NextResponse.json({ error: "The course owner cannot be removed." }, { status: 400 });
  }

  await CourseModel.updateOne(
    { _id: courseId },
    { $pull: { members: { userId } } }
  );

  return NextResponse.json({ ok: true });
}