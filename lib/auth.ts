import { cookies } from "next/headers";

import {
  connectDB,
  newId,
  Session as SessionModel,
  toUser,
  User as UserModel,
} from "./mongo";
import type { User } from "./types";

export const SESSION_COOKIE = "studysync_session";
export const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  await connectDB();
  const session = await SessionModel.findById(sessionId).lean();
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await SessionModel.deleteOne({ _id: sessionId });
    return null;
  }

  const userDoc = await UserModel.findById(session.userId).lean();
  if (!userDoc) {
    await SessionModel.deleteOne({ _id: sessionId });
    return null;
  }
  return toUser(userDoc);
}

export async function createSession(userId: string): Promise<void> {
  await connectDB();
  const sessionId = newId("ses");
  const now = new Date();
  await SessionModel.create({
    _id: sessionId,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await connectDB();
    await SessionModel.deleteOne({ _id: sessionId });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}
