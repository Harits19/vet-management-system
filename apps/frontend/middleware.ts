import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FRONTEND_AUTH_COOKIE } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const authCookie = req.cookies.get(FRONTEND_AUTH_COOKIE)?.value;

  const { pathname } = req.nextUrl;

  if (!authCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (authCookie && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}
