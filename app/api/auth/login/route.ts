import { NextResponse } from "next/server";

import { createSession, publicUser } from "@/lib/auth";
import { connectDB, toUser, User as UserModel } from "@/lib/mongo";
import { verifyPassword } from "@/lib/passwords";
import { validateLoginFields } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const rawPassword = password ?? "";

  const errors = validateLoginFields({ email: normalizedEmail, password: rawPassword });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  await connectDB();
  const userDoc = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (!userDoc || !userDoc.passwordHash) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(rawPassword, userDoc.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Email or password is incorrect." },
      { status: 401 }
    );
  }

  const user = toUser(userDoc);
  await createSession(user.id);

  return NextResponse.json({ user: publicUser(user) });
}
