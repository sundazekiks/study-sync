import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(token);
  }
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}