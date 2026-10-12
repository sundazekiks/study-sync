import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { connectDB, Course as CourseModel, toCourse, User as UserModel } from "@/lib/mongo";
import { getRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "moderator", "member"];

export async function POST(req: Request, ctx: RouteContext<"/api/courses/[courseId]/members">) {
  const { courseId } = await ctx.params;
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

  const { email, role } = (body ?? {}) as { email?: string; role?: string };
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const requestedRole = (role ?? "member") as Role;

  if (!normalizedEmail) {
    return NextResponse.json({ error: "An email is required." }, { status: 400 });
  }
  if (!ROLES.includes(requestedRole)) {
    return NextResponse.json({ error: "Role must be owner, moderator, or member." }, { status: 400 });
  }

  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  if (!doc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(doc);

  const myRole = getRole(course, user.id);
  if (myRole !== "owner") {
    return NextResponse.json({ error: "Only the course owner can manage members." }, { status: 403 });
  }

  const targetDoc = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (!targetDoc) {
    return NextResponse.json(
      { error: "No student with that email exists yet. Ask them to create an account first." },
      { status: 404 }
    );
  }

  if (course.members.some((m) => m.userId === targetDoc._id)) {
    return NextResponse.json(
      { error: "That student is already a member of this course." },
      { status: 409 }
    );
  }

  await CourseModel.updateOne(
    { _id: courseId },
    {
      $push: {
        members: { userId: targetDoc._id, role: requestedRole, joinedAt: new Date().toISOString() },
      },
    }
  );

  return NextResponse.json(
    {
      member: {
        userId: targetDoc._id,
        role: requestedRole,
        displayName: targetDoc.displayName,
      },
    },
    { status: 201 }
  );
}