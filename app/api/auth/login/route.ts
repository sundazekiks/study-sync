import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createSession, publicUser, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { connectDB, toUser, User as UserModel } from "@/lib/mongo";

export async function POST(request: Request) {

  await connectDB();

  const users = await UserModel.find({});

  console.log(users)
  return NextResponse.json(users)
}