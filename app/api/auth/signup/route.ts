import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createFirstUser, createSession, publicUser, SESSION_COOKIE } from "@/lib/auth";
import { connectDB, User as UserModel } from "@/lib/mongo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, displayName, password } = (body ?? {}) as {
    email?: string;
    displayName?: string;
    password?: string;
  };

  const errors: string[] = [];
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const normalizedName = (displayName ?? "").trim();

  if (!normalizedEmail) {
    errors.push("Email is required.");
  } else if (!EMAIL_RE.test(normalizedEmail)) {
    errors.push("Enter a valid email address.");
  }
  if (!normalizedName) {
    errors.push("Display name is required.");
  }
  if (!password) {
    errors.push("Password is required.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  await connectDB();
  const existing = await UserModel.exists({ email: normalizedEmail });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Use a different email or sign in." },
      { status: 409 }
    );
  }

  const user = await createFirstUser(normalizedEmail, normalizedName, password as string);
  const session = await createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}