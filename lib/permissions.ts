import { connectDB, Course as CourseModel, toCourse } from "./mongo";
import type { Course, Role } from "./types";

export function getMembership(course: Course, userId: string) {
  return course.members.find((m) => m.userId === userId);
}

export function isMember(course: Course, userId: string): boolean {
  return getMembership(course, userId) !== undefined;
}

export function getRole(course: Course, userId: string): Role | null {
  return getMembership(course, userId)?.role ?? null;
}

export function isModerator(course: Course, userId: string): boolean {
  const role = getRole(course, userId);
  return role === "owner" || role === "moderator";
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  await connectDB();
  const doc = await CourseModel.findById(courseId).lean();
  return doc ? toCourse(doc) : null;
}

export async function requireMember(course: Course, userId: string) {
  if (!isMember(course, userId)) {
    return {
      ok: false as const,
      error: "You do not have access to this course.",
      status: 403 as const,
    };
  }
  return { ok: true as const };
}

export function canManageResource(
  course: Course,
  resource: { createdById: string },
  userId: string
): boolean {
  if (resource.createdById === userId) return true;
  return isModerator(course, userId);
}

export function canManageTask(
  course: Course,
  task: { createdById: string },
  userId: string
): boolean {
  if (task.createdById === userId) return true;
  return isModerator(course, userId);
}

export function canUpdateTaskProgress(
  course: Course,
  task: { createdById: string; assigneeId: string },
  userId: string
): boolean {
  if (task.createdById === userId) return true;
  if (task.assigneeId === userId) return true;
  return isModerator(course, userId);
}