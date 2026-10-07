export type Role = "owner" | "moderator" | "member";

export type ResourceType = "link" | "file";

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Membership {
  userId: string;
  role: Role;
  joinedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  members: Membership[];
  createdAt: string;
}

export interface CourseView {
  id: string;
  name: string;
  description: string;
  color: string;
  role: Role;
  resourceCount: number;
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