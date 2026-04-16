import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    await verifyAuthToken(token);
    return NextResponse.next();
  } catch (_error) {
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
    });
    return response;
  }
}

export const config = {
  matcher: "/dashboard/:path*",
};
