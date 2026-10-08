import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB, User } from "@/lib/mongo";
import { Task } from "@/lib/schemas/task";
import { readUpload } from "@/lib/uploads";

function safeFileName(name: string): string {
  return name.replace(/["\r\n]/g, "_");
}

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/tasks/[taskId]/attachments/[fileId]">
) {
  const { taskId, fileId } = await ctx.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const task = await Task.findById(taskId).lean();
  if (!task || task.userId !== user._id) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const attachment = task.attachments?.find((item) => item.fileId === fileId);
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const buffer = await readUpload(fileId);
  if (!buffer) {
    return NextResponse.json(
      { error: "This file is unavailable. It may have been removed from storage." },
      { status: 404 }
    );
  }

  const displayName = safeFileName(attachment.name ?? `task-${taskId}`);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${displayName}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}