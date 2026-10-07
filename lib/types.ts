export type Role = "owner" | "moderator" | "member";

export type ResourceType = "link" | "file";

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Membership {
  userId: string;
  role: Role;
  joinedAt: string;
}

export type TaskStatus = "not-started" | "in-progress" | "completed";

export interface TaskSummary {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface Task {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
  status: TaskStatus;
  createdById: string;
  createdAt: string;
  updatedById: string;
  updatedAt: string;
}

export interface TaskView {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  creator: {
    id: string;
    displayName: string;
  };
  assignee: {
    id: string;
    displayName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
  canProgress: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  members: Membership[];
  taskSummary: TaskSummary;
  createdAt: string;
}

export interface CourseView {
  id: string;
  name: string;
  description: string;
  color: string;
  role: Role;
  resourceCount: number;
  taskSummary: TaskSummary;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: ResourceType;
  description: string;
  tags: string[];
  location: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  createdById: string;
  createdAt: string;
  updatedById: string;
  updatedAt: string;
}

export interface ResourceView {
  id: string;
  courseId: string;
  title: string;
  type: ResourceType;
  description: string;
  tags: string[];
  location: string;
  fileUrl?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  creator: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}