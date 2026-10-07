import type { QueryFilter } from "mongoose";

import {
  connectDB,
  Course as CourseModel,
  Task as TaskModel,
  toCourse,
  User as UserModel,
} from "./mongo";
import type { TaskDoc, TaskDocLean } from "./mongo";
import { canManageTask, canUpdateTaskProgress, isMember } from "./permissions";
import type { Course, TaskStatus, TaskSummary, TaskView } from "./types";
import { isTaskStatus } from "./validators";

export interface TaskFilters {
  status?: TaskStatus;
  assignee?: string;
  dueFrom?: string;
  dueTo?: string;
}

export async function displayNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  await connectDB();
  const users = await UserModel.find({ _id: { $in: unique } }).lean();
  return new Map(users.map((u) => [u._id, u.displayName]));
}

export async function recomputeTaskSummary(courseId: string): Promise<TaskSummary> {
  await connectDB();
  const rows = await TaskModel.aggregate<{ _id: TaskStatus; count: number }>([
    { $match: { courseId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const summary: TaskSummary = { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
  for (const row of rows) {
    summary.total += row.count;
    if (row._id === "not-started") summary.notStarted = row.count;
    else if (row._id === "in-progress") summary.inProgress = row.count;
    else if (row._id === "completed") summary.completed = row.count;
  }
  await CourseModel.updateOne({ _id: courseId }, { taskSummary: summary });
  return summary;
}

export async function loadTaskContext(
  taskId: string
): Promise<{ task: TaskDocLean | null; course: Course | null }> {
  await connectDB();
  const doc = await TaskModel.findById(taskId).lean();
  if (!doc) return { task: null, course: null };
  const courseDoc = await CourseModel.findById(doc.courseId).lean();
  return { task: doc, course: courseDoc ? toCourse(courseDoc) : null };
}

export function toTaskView(
  task: TaskDocLean,
  names: Map<string, string>,
  course: Course,
  currentUserId: string
): TaskView {
  return {
    id: task._id,
    courseId: task.courseId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    creator: {
      id: task.createdById,
      displayName: names.get(task.createdById) ?? "Unknown",
    },
    assignee: task.assigneeId
      ? { id: task.assigneeId, displayName: names.get(task.assigneeId) ?? "Unknown" }
      : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    canEdit: canManageTask(course, task, currentUserId),
    canDelete: canManageTask(course, task, currentUserId),
    canProgress: canUpdateTaskProgress(course, task, currentUserId),
  };
}

export function parseTaskFilters(
  params: URLSearchParams,
  currentUserId: string
): { filters?: TaskFilters; error?: string } {
  const status = params.get("status");
  const assignee = params.get("assignee");
  const dueFrom = params.get("dueFrom");
  const dueTo = params.get("dueTo");

  const filters: TaskFilters = {};

  if (status && status !== "all") {
    if (!isTaskStatus(status)) {
      return { error: "Status must be one of: not-started, in-progress, completed." };
    }
    filters.status = status as TaskStatus;
  }
  if (assignee && assignee !== "all") {
    if (assignee === "me") {
      filters.assignee = currentUserId;
    } else if (assignee === "unassigned") {
      filters.assignee = "";
    } else if (assignee.startsWith("usr_")) {
      filters.assignee = assignee;
    } else {
      return { error: "Assignee filter is not valid." };
    }
  }
  for (const [key, value] of [
    ["dueFrom", dueFrom],
    ["dueTo", dueTo],
  ] as const) {
    if (value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { error: `${key} must be a date in YYYY-MM-DD format.` };
      }
      filters[key] = value;
    }
  }
  if (filters.dueFrom && filters.dueTo && filters.dueFrom > filters.dueTo) {
    return { error: "dueFrom must be on or before dueTo." };
  }

  return { filters };
}

export function taskQuery(filters: TaskFilters, courseId?: string): QueryFilter<TaskDoc> {
  const query: QueryFilter<TaskDoc> = {};
  if (courseId) query.courseId = courseId;
  if (filters.status) query.status = filters.status;
  if (filters.assignee !== undefined) query.assigneeId = filters.assignee;
  if (filters.dueFrom || filters.dueTo) {
    query.dueDate = {
      ...(filters.dueFrom ? { $gte: filters.dueFrom } : {}),
      ...(filters.dueTo ? { $gt: "", $lte: filters.dueTo } : {}),
    };
  }
  return query;
}

export function sortTasksByDueDate<T extends { dueDate: string; createdAt: string }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    const left = a.dueDate || "9999-12-31";
    const right = b.dueDate || "9999-12-31";
    if (left !== right) return left.localeCompare(right);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export interface MyTaskView extends TaskView {
  courseName: string;
  courseColor: string;
}

export async function listTasksAssignedTo(userId: string, limit = 10): Promise<MyTaskView[]> {
  await connectDB();
  const docs = await TaskModel.find({ assigneeId: userId }).lean();
  if (docs.length === 0) return [];

  const courseDocs = await CourseModel.find({
    _id: { $in: [...new Set(docs.map((d) => d.courseId))] },
  }).lean();
  const courseById = new Map(
    courseDocs
      .filter((doc) => isMember(toCourse(doc), userId))
      .map((doc) => [doc._id, toCourse(doc)])
  );

  const visible = docs.filter((doc) => courseById.has(doc.courseId));
  const names = await displayNames([userId]);

  return sortTasksByDueDate(visible)
    .slice(0, limit)
    .map((doc) => {
      const course = courseById.get(doc.courseId)!;
      return {
        ...toTaskView(doc, names, course, userId),
        courseName: course.name,
        courseColor: course.color,
      };
    });
}

export async function listTasksForUser(
  userId: string,
  opts: { courseId?: string; status?: string; assignee?: string; limit?: number } = {}
): Promise<{ tasks: MyTaskView[]; matches: number }> {
  await connectDB();
  const courseDocs = await CourseModel.find({ "members.userId": userId }).lean();
  const courses = courseDocs.map(toCourse);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const filter: Record<string, unknown> = {};
  if (opts.courseId) {
    if (!courseById.has(opts.courseId)) {
      return { tasks: [], matches: 0 };
    }
    filter.courseId = opts.courseId;
  } else if (courseById.size > 0) {
    filter.courseId = { $in: [...courseById.keys()] };
  } else {
    return { tasks: [], matches: 0 };
  }

  if (opts.status && opts.status !== "all") {
    if (!isTaskStatus(opts.status)) return { tasks: [], matches: 0 };
    filter.status = opts.status;
  }
  if (opts.assignee === "me") {
    filter.assigneeId = userId;
  } else if (opts.assignee && opts.assignee !== "all") {
    filter.assigneeId = opts.assignee;
  }

  const docs = await TaskModel.find(filter).lean();
  const names = await displayNames(
    docs.flatMap((d) => [d.createdById, d.assigneeId])
  );

  const tasks = sortTasksByDueDate(docs)
    .filter((doc) => courseById.has(doc.courseId))
    .slice(0, opts.limit ?? 50)
    .map((doc) => {
      const course = courseById.get(doc.courseId)!;
      return {
        ...toTaskView(doc, names, course, userId),
        courseName: course.name,
        courseColor: course.color,
      };
    });

  return { tasks, matches: tasks.length };
}