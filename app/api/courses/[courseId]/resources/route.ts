import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { connectDB, Course as CourseModel, newId, Resource as ResourceModel, toCourse, User as UserModel } from "@/lib/mongo";
import { canManageResource, isMember } from "@/lib/permissions";
import type { Course, ResourceView } from "@/lib/types";
import { saveUpload } from "@/lib/uploads";
import {
  DESCRIPTION_MAX_LENGTH,
  isValidUrl,
  parseTags,
  TAGS_MAX,
  TITLE_MAX_LENGTH,
  validateUploadedFile,
} from "@/lib/validators";

async function displayNames(ids: string[]): Promise<Map<string, string>> {
  await connectDB();
  const users = await UserModel.find({ _id: { $in: ids } }).lean();
  return new Map(users.map((u) => [u._id, u.displayName]));
}

function toView(
  resource: import("@/lib/mongo").ResourceDocLean,
  names: Map<string, string>,
  course: Course,
  currentUserId: string
): ResourceView {
  const canEdit = canManageResource(course, resource, currentUserId);
  return {
    id: resource._id,
    courseId: resource.courseId,
    title: resource.title,
    type: resource.type,
    description: resource.description,
    tags: resource.tags,
    location: resource.location,
    originalName: resource.originalName,
    mimeType: resource.mimeType,
    size: resource.size,
    fileUrl: resource.type === "file" ? `/api/resources/${resource._id}/file` : undefined,
    creator: {
      id: resource.createdById,
      displayName: names.get(resource.createdById) ?? "Unknown",
    },
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    canEdit,
    canDelete: canEdit,
  };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/courses/[courseId]/resources">) {
  const { courseId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const courseDoc = await CourseModel.findById(courseId).lean();
  if (!courseDoc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(courseDoc);
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }

  const resources = await ResourceModel.find({ courseId }).sort({ createdAt: -1 }).lean();
  const names = await displayNames(resources.map((r) => r.createdById));

  return NextResponse.json({
    resources: resources.map((r) => toView(r, names, course, user.id)),
  });
}

export async function POST(req: Request, ctx: RouteContext<"/api/courses/[courseId]/resources">) {
  const { courseId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const courseDoc = await CourseModel.findById(courseId).lean();
  if (!courseDoc) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  const course = toCourse(courseDoc);
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const now = new Date().toISOString();

  let title = "";
  let type: "link" | "file" = "link";
  let description = "";
  let tags: string[] = [];
  let location = "";
  let originalName: string | undefined;
  let mimeType: string | undefined;
  let size: number | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") ?? "").trim();
    type = String(form.get("type") ?? "link") === "file" ? "file" : "link";
    if (type === "file") {
      const file = form.get("file");
      if (file instanceof File) {
        const check = validateUploadedFile(file);
        if (!check.ok) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
        originalName = file.name;
        mimeType = file.type || "application/octet-stream";
        size = file.size;
        const saved = await saveUpload(file);
        location = saved.fileId;
      } else {
        return NextResponse.json(
          { error: "A file is required. Choose a file to upload." },
          { status: 400 }
        );
      }
    } else {
      location = String(form.get("url") ?? "").trim();
    }
    description = String(form.get("description") ?? "").trim();
    tags = parseTags(String(form.get("tags") ?? ""));
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = (body ?? {}) as {
      title?: string;
      type?: string;
      location?: string;
      url?: string;
      description?: string;
      tags?: string;
    };
    title = String(parsed.title ?? "").trim();
    type = String(parsed.type ?? "link") === "file" ? "file" : "link";
    location = String(parsed.location ?? parsed.url ?? "").trim();
    description = String(parsed.description ?? "").trim();
    tags = parseTags(String(parsed.tags ?? ""));
  }

  const errors: string[] = [];
  if (!title) {
    errors.push("A title is required.");
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }
  if (type === "link") {
    if (!location) {
      errors.push("A URL is required for a link resource.");
    } else if (!isValidUrl(location)) {
      errors.push("Location must be a valid http or https URL.");
    }
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  if (tags.length > TAGS_MAX) {
    errors.push(`You can add at most ${TAGS_MAX} tags.`);
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  if (type === "link") {
    const normalized = normalizeUrl(location);
    const allLinks = await ResourceModel.find({ courseId, type: "link" }).lean();
    const duplicate = allLinks.find(
      (r) => normalizeUrl(r.location) === normalized
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `This link is already saved in the course as "${duplicate.title}".` },
        { status: 409 }
      );
    }
  }

  const doc = await ResourceModel.create({
    _id: newId("res"),
    courseId,
    title,
    type,
    description,
    tags,
    location,
    originalName,
    mimeType,
    size,
    createdById: user.id,
    createdAt: now,
    updatedById: user.id,
    updatedAt: now,
  });

  const names = await displayNames([user.id]);
  return NextResponse.json(
    { resource: toView(doc.toObject() as import("@/lib/mongo").ResourceDocLean, names, course, user.id) },
    { status: 201 }
  );
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return url.trim();
  }
}