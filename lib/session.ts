import { auth } from "@/auth";
import { getSessionUser } from "./auth";
import { connectDB, toUser, User as UserModel } from "./mongo";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  const sessionUser = session?.user;

  if (sessionUser) {
    await connectDB();
    if (sessionUser.email) {
      const doc = await UserModel.findOne({ email: sessionUser.email }).lean();
      if (doc) return toUser(doc);
    }
    if (sessionUser.id) {
      const doc = await UserModel.findById(sessionUser.id).lean();
      if (doc) return toUser(doc);
    }
  }

  return getSessionUser();
}