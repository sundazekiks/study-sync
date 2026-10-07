import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/study-sync";

const cached = globalThis as unknown as {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

export async function connectDB(): Promise<typeof mongoose> {
  if (!cached.mongoose) cached.mongoose = { conn: null, promise: null };
  if (cached.mongoose.conn) return cached.mongoose.conn;
  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose.connect(MONGODB_URI);
  }
  cached.mongoose.conn = await cached.mongoose.promise;
  return cached.mongoose.conn;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: String, required: true },
});

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: String, required: true },
  expiresAt: { type: String, required: true },
});

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ["owner", "moderator", "member"], required: true },
    joinedAt: { type: String, required: true },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  color: { type: String, default: "#6366f1" },
  ownerId: { type: String, required: true },
  members: { type: [membershipSchema], default: [] },
  createdAt: { type: String, required: true },
});

const resourceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  courseId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["link", "file"], required: true },
  description: { type: String, default: "" },
  tags: { type: [String], default: [] },
  location: { type: String, default: "" },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  createdById: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedById: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", userSchema);
export const Session =
  (mongoose.models.Session as mongoose.Model<SessionDoc>) ??
  mongoose.model<SessionDoc>("Session", sessionSchema);
export const Course =
  (mongoose.models.Course as mongoose.Model<CourseDoc>) ??
  mongoose.model<CourseDoc>("Course", courseSchema);
export const Resource =
  (mongoose.models.Resource as mongoose.Model<ResourceDoc>) ??
  mongoose.model<ResourceDoc>("Resource", resourceSchema);

export interface UserDoc {
  _id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

export interface SessionDoc {
  _id: string;
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface MembershipDoc {
  userId: string;
  role: "owner" | "moderator" | "member";
  joinedAt: string;
}

export interface CourseDoc {
  _id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  members: MembershipDoc[];
  createdAt: string;
}

export interface ResourceDoc {
  _id: string;
  courseId: string;
  title: string;
  type: "link" | "file";
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

export type UserDocLean = UserDoc & { _id: string };
export type CourseDocLean = CourseDoc & { _id: string };
export type ResourceDocLean = ResourceDoc & { _id: string };

export function toUser(doc: UserDoc): {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
} {
  return {
    id: doc._id,
    email: doc.email,
    displayName: doc.displayName,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

export function toCourse(doc: CourseDoc): {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  members: MembershipDoc[];
  createdAt: string;
} {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    color: doc.color,
    ownerId: doc.ownerId,
    members: doc.members,
    createdAt: doc.createdAt,
  };
}

export function toResource(doc: ResourceDoc): {
  id: string;
  courseId: string;
  title: string;
  type: "link" | "file";
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
} {
  return {
    id: doc._id,
    courseId: doc.courseId,
    title: doc.title,
    type: doc.type,
    description: doc.description,
    tags: doc.tags,
    location: doc.location,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    createdById: doc.createdById,
    createdAt: doc.createdAt,
    updatedById: doc.updatedById,
    updatedAt: doc.updatedAt,
  };
}