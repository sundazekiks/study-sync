import {
  connectDB,
  Course as CourseModel,
  emptyTaskSummary,
  Resource as ResourceModel,
  toCourse,
} from "./mongo";
import type { CourseView } from "./types";

export async function listCourseViews(userId: string): Promise<CourseView[]> {
  await connectDB();
  const courses = await CourseModel.find({ "members.userId": userId }).lean();
  const resourceCounts = await ResourceModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);
  const countByCourse = new Map(resourceCounts.map((r) => [r._id, r.count]));

  return courses
    .map((doc) => toCourse(doc))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      color: course.color,
      role: course.members.find((m) => m.userId === userId)?.role ?? "member",
      resourceCount: countByCourse.get(course.id) ?? 0,
      taskSummary: course.taskSummary ?? emptyTaskSummary(),
    }));
}