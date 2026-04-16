import { serialize } from "cookie";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { serverEnv } from "../config/env";

const encoder = new TextEncoder();

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "staff";
}

export async function signAccessToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(serverEnv.authSecret));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, encoder.encode(serverEnv.authSecret));

  return payload as unknown as SessionPayload;
}

export function createAuthCookie(token: string) {
  return serialize(serverEnv.cookieName, token, {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  return serialize(serverEnv.cookieName, "", {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
