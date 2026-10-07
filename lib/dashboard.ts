import { connectDB, Course as CourseModel, Task as TaskModel, toCourse } from "./mongo";
import { displayNames, sortTasksByDueDate, toTaskView } from "./tasks";
import type { MyTaskView } from "./tasks";

export interface DashboardStats {
  courseCount: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  progressPercent: number;
  upcomingTasks: MyTaskView[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  await connectDB();
  const courseDocs = await CourseModel.find({ "members.userId": userId }).lean();
  const courses = courseDocs.map(toCourse);
  const courseIds = courses.map((c) => c.id);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const tasks = courseIds.length
    ? await TaskModel.find({ courseId: { $in: courseIds }, assigneeId: userId }).lean()
    : [];

  let active = 0;
  let completed = 0;
  for (const task of tasks) {
    if (task.status === "completed") completed += 1;
    else active += 1;
  }
  const total = tasks.length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const upcomingDocs = sortTasksByDueDate(
    tasks.filter((t: (typeof tasks)[number]) => t.status !== "completed")
  ).slice(0, 5);

  const names = await displayNames([userId]);
  const upcomingTasks = upcomingDocs.map((doc) => {
    const course = courseById.get(doc.courseId);
    if (!course) return null;
    return {
      ...toTaskView(doc, names, course, userId),
      courseName: course.name,
      courseColor: course.color,
    };
  });

  return {
    courseCount: courses.length,
    totalTasks: total,
    activeTasks: active,
    completedTasks: completed,
    progressPercent,
    upcomingTasks: upcomingTasks.filter((t): t is MyTaskView => t !== null),
  };
}
