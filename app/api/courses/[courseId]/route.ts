import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB, Course as CourseModel, Resource as ResourceModel, toCourse, User as UserModel } from "@/lib/mongo";
import { requireMember } from "@/lib/permissions";

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
    },
  });
}