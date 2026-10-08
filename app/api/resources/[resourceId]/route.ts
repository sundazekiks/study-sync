import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { connectDB, Course as CourseModel, Resource as ResourceModel, toCourse, User as UserModel } from "@/lib/mongo";
import type { Course } from "@/lib/types";
import { canManageResource, isMember } from "@/lib/permissions";
import type { ResourceDocLean } from "@/lib/mongo";
import type { ResourceView } from "@/lib/types";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import {
  DESCRIPTION_MAX_LENGTH,
  isValidUrl,
  parseTags,
  TAGS_MAX,
  TITLE_MAX_LENGTH,
  validateUploadedFile,
} from "@/lib/validators";

async function loadResourceContext(resourceId: string) {
  await connectDB();
  const doc = await ResourceModel.findById(resourceId).lean();
  if (!doc) return { resource: null as ResourceDocLean | null, course: null as Course | null };
  const courseDoc = await CourseModel.findById(doc.courseId).lean();
  const course = courseDoc ? toCourse(courseDoc) : null;
  return { resource: doc, course };
}

async function displayName(userId: string): Promise<string> {
  await connectDB();
  const user = await UserModel.findById(userId).lean();
  return user?.displayName ?? "Unknown";
}

function toView(resource: ResourceDocLean, course: Course, currentUserId: string, creatorName: string): ResourceView {
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
    creator: { id: resource.createdById, displayName: creatorName },
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    canEdit,
    canDelete: canEdit,
  };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/resources/[resourceId]">) {
  const { resourceId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { resource, course } = await loadResourceContext(resourceId);
  if (!resource || !course) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }

  const creatorName = await displayName(resource.createdById);
  return NextResponse.json({ resource: toView(resource, course, user.id, creatorName) });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/resources/[resourceId]">) {
  const { resourceId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { resource, course } = await loadResourceContext(resourceId);
  if (!resource || !course) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }
  if (!canManageResource(course, resource, user.id)) {
    return NextResponse.json(
      { error: "Only the resource creator or a course moderator can edit this." },
      { status: 403 }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const form = isMultipart ? await req.formData() : null;

  let title: string | null = null;
  let description: string | null = null;
  let tags: string[] | null = null;
  let url: string | null = null;

  if (form) {
    title = String(form.get("title") ?? "").trim() || null;
    description = String(form.get("description") ?? "").trim() || null;
    tags = parseTags(String(form.get("tags") ?? ""));
    url = String(form.get("url") ?? "").trim() || null;
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = (body ?? {}) as {
      title?: string;
      description?: string;
      tags?: string;
      url?: string;
    };
    title = parsed.title !== undefined ? String(parsed.title).trim() || null : null;
    description =
      parsed.description !== undefined ? String(parsed.description).trim() || null : null;
    tags = parsed.tags !== undefined ? parseTags(String(parsed.tags)) : null;
    url = parsed.url !== undefined ? String(parsed.url).trim() || null : null;
  }

  const nextTitle = title ?? resource.title;
  const nextDescription = description ?? resource.description;
  const nextTags = tags ?? resource.tags;

  let location = resource.location;
  let originalName = resource.originalName;
  let mimeType = resource.mimeType;
  let size = resource.size;

  if (resource.type === "link" && url !== null) {
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Location must be a valid http or https URL." }, { status: 400 });
    }
    location = url;
  } else if (resource.type === "file") {
    const file = form?.get("file");
    if (file instanceof File && file.size > 0) {
      const check = validateUploadedFile(file);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      const oldFileId = resource.location;
      const saved = await saveUpload(file);
      await deleteUpload(oldFileId);
      location = saved.fileId;
      originalName = file.name;
      mimeType = file.type || "application/octet-stream";
      size = file.size;
    }
  }

  const errors: string[] = [];
  if (!nextTitle) {
    errors.push("A title is required.");
  } else if (nextTitle.length > TITLE_MAX_LENGTH) {
    errors.push(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
  }
  if (nextDescription.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }
  if (nextTags.length > TAGS_MAX) {
    errors.push(`You can add at most ${TAGS_MAX} tags.`);
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  await ResourceModel.updateOne(
    { _id: resourceId },
    {
      title: nextTitle,
      description: nextDescription,
      tags: nextTags,
      location,
      originalName,
      mimeType,
      size,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    }
  );

  const { resource: updated } = await loadResourceContext(resourceId);
  if (!updated || !course) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  const creatorName = await displayName(updated.createdById);
  return NextResponse.json({ resource: toView(updated, course, user.id, creatorName) });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/resources/[resourceId]">) {
  const { resourceId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { resource, course } = await loadResourceContext(resourceId);
  if (!resource || !course) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  if (!isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }
  if (!canManageResource(course, resource, user.id)) {
    return NextResponse.json(
      { error: "Only the resource creator or a course moderator can delete this." },
      { status: 403 }
    );
  }

  await connectDB();
  await ResourceModel.deleteOne({ _id: resourceId });

  if (resource.type === "file" && resource.location) {
    await deleteUpload(resource.location);
  }

  return NextResponse.json({ ok: true });
}