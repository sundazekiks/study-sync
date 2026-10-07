import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { connectDB, Course as CourseModel, newId, Resource as ResourceModel, toCourse } from "@/lib/mongo";
import type { CourseDoc } from "@/lib/mongo";
import type { Role } from "@/lib/types";

import { auth } from "@/auth";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export async function GET() {
  const user = await auth();
  if (!user?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const courses = await CourseModel.find({ "members.userId": user?.user.id }).lean();
  const resourceCounts = await ResourceModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);
  const countByCourse = new Map(resourceCounts.map((r) => [r._id, r.count]));

  const myCourses = courses
    .map((c) => {
      const course = toCourse(c);
      const membership = course.members.find((m) => m.userId === user?.user?.id)!;
      return {
        id: course.id,
        name: course.name,
        description: course.description,
        color: course.color,
        role: membership.role,
        resourceCount: countByCourse.get(course.id) ?? 0,
        createdAt: course.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ courses: myCourses });
}

export async function POST(request: Request) {
  const user = await auth();
  if (!user?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, description, color: requestedColor } = (body ?? {}) as {
    name?: string;
    description?: string;
    color?: string;
  };
  const trimmedName = (name ?? "").trim();

  if (!trimmedName) {
    return NextResponse.json({ error: "A course name is required." }, { status: 400 });
  }
  if (trimmedName.length > 80) {
    return NextResponse.json({ error: "Course name must be 80 characters or fewer." }, { status: 400 });
  }

  let color = COLORS[dbHash(trimmedName) % COLORS.length];
  if (requestedColor && /^#[0-9a-fA-F]{6}$/.test(requestedColor)) {
    color = requestedColor.toLowerCase();
  }

  await connectDB();
  const doc = await CourseModel.create({
    _id: newId("crs"),
    name: trimmedName,
    description: (description ?? "").trim(),
    color,
    ownerId: user.user.id,
    members: [{ userId: user.user.id, role: "owner" as Role, joinedAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  });
  const course = toCourse(doc.toObject() as CourseDoc);

  return NextResponse.json({ course }, { status: 201 });
}

function dbHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}