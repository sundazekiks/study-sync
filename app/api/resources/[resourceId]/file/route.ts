import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { connectDB, Course as CourseModel, Resource as ResourceModel, toCourse } from "@/lib/mongo";
import { isMember } from "@/lib/permissions";
import { readUpload } from "@/lib/uploads";

export async function GET(_req: Request, ctx: RouteContext<"/api/resources/[resourceId]/file">) {
  const { resourceId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const resource = await ResourceModel.findById(resourceId).lean();
  if (!resource || resource.type !== "file") {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const courseDoc = await CourseModel.findById(resource.courseId).lean();
  const course = courseDoc ? toCourse(courseDoc) : null;
  if (!course || !isMember(course, user.id)) {
    return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 });
  }

  const buffer = await readUpload(resource.location);
  if (!buffer) {
    return NextResponse.json(
      { error: "This file is unavailable. It may have been removed from storage." },
      { status: 404 }
    );
  }

  const displayName = resource.originalName ?? `resource-${resource._id}`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": resource.mimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${displayName}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}