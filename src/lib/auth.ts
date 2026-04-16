import { parse, serialize } from "cookie";
import { JWTPayload, jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "vet_auth_token";
const AUTH_MAX_AGE = 60 * 60;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthTokenPayload = JWTPayload & AuthUser;

const getAuthSecret = () => {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "development-auth-secret";

  return new TextEncoder().encode(secret);
};

export const createAuthToken = async (user: AuthUser) => {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_MAX_AGE}s`)
    .sign(getAuthSecret());
};

export const verifyAuthToken = async (token: string) => {
  const { payload } = await jwtVerify<AuthTokenPayload>(token, getAuthSecret());

  return {
    id: payload.sub || "",
    email: payload.email || "",
    name: payload.name || "",
    role: payload.role || "",
  };
};

export const serializeAuthCookie = (token: string) =>
  serialize(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });

export const clearAuthCookie = () =>
  serialize(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

export const getAuthTokenFromCookieHeader = (cookieHeader?: string | null) => {
  if (!cookieHeader) return "";

  const cookies = parse(cookieHeader);
  return cookies[AUTH_COOKIE_NAME] || "";
};
