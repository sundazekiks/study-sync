import { NextResponse } from "next/server";

import { createSession, publicUser } from "@/lib/auth";
import { connectDB, toUser, User as UserModel } from "@/lib/mongo";
import { verifyPassword } from "@/lib/passwords";
import { validateLoginFields } from "@/lib/validators";

export async function POST(request: Request) {

  await connectDB();

  const users = await UserModel.find({});

  console.log(users)
  return NextResponse.json(users)
}
