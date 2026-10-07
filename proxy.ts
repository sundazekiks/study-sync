import { NextResponse, type NextRequest } from "next/server";

// Optimistic cookie check only — real validation happens in server components and API routes.
const SESSION_COOKIE = "studysync_session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    const next = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/courses/:path*"],
};
