import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { connectDB, newId, Session as SessionModel, toUser, User as UserModel } from "./mongo";
import type { Session, User } from "./types";

const SESSION_COOKIE = "study_sync_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const candidate = createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
  return candidate === hash;
}

function sessionExpiresAt(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function createSession(userId: string): Promise<Session> {
  await connectDB();
  const session: Session = {
    token: randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: sessionExpiresAt(),
  };
  await SessionModel.create({
    _id: newId("ses"),
    token: session.token,
    userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  });
  return session;
}

export async function deleteSession(token: string): Promise<void> {
  await connectDB();
  await SessionModel.deleteOne({ token });
}

export async function getSessionUser(): Promise<User | null> {
  const { auth } = await import("../auth");
  const authSession = await auth();
  const authUserId = authSession?.user?.id;

  if (authUserId) {
    await connectDB();
    const authUser = await UserModel.findById(authUserId).lean();
    if (authUser) return toUser(authUser);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDB();
  const session = await SessionModel.findOne({ token }).lean();
  if (!session) return null;
  if (Date.parse(session.expiresAt) < Date.now()) return null;

  const user = await UserModel.findById(session.userId).lean();
  return user ? toUser(user) : null;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export { SESSION_COOKIE };

export async function createFirstUser(email: string, displayName: string, password: string): Promise<User> {
  await connectDB();
  const user = await UserModel.create({
    _id: newId("usr"),
    email,
    displayName,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  return toUser(user);
}