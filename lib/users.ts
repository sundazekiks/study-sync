import { connectDB, newId, toUser, User as UserModel } from "./mongo";
import type { User } from "./types";

export interface OAuthUserProfile {
  email: string;
  displayName: string;
}

export async function findOrCreateOAuthUser({ email, displayName }: OAuthUserProfile): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  await connectDB();
  const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    return toUser(existing);
  }

  const created = await UserModel.create({
    _id: newId("usr"),
    email: normalizedEmail,
    displayName: displayName.trim() || normalizedEmail.split("@")[0],
    createdAt: new Date().toISOString(),
  });
  return toUser(created);
}
