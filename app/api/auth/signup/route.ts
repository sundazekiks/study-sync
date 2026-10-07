import { NextResponse } from "next/server";

import { createSession, publicUser } from "@/lib/auth";
import { connectDB, newId, toUser, User as UserModel } from "@/lib/mongo";
import type { UserDoc } from "@/lib/mongo";
import { hashPassword } from "@/lib/passwords";
import { validateSignupFields } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { displayName, email, password } = (body ?? {}) as {
    displayName?: string;
    email?: string;
    password?: string;
  };
  const trimmedName = (displayName ?? "").trim();
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const rawPassword = password ?? "";

  const errors = validateSignupFields({
    displayName: trimmedName,
    email: normalizedEmail,
    password: rawPassword,
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  await connectDB();
  const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Log in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(rawPassword);
  const doc = await UserModel.create({
    _id: newId("usr"),
    email: normalizedEmail,
    displayName: trimmedName,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  const user = toUser(doc.toObject() as UserDoc);

  await createSession(user.id);

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
