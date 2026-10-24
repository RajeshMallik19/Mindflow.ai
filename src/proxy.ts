import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, computeAuthToken } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const expected = computeAuthToken();
  if (!expected) return NextResponse.next(); // no APP_PASSWORD set -> open (local dev default)

  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
