import type { Request } from "express";
import type { UserRole } from "@vet/shared";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: UserRole;
  };
}

const DEFAULT_FRONTEND_ORIGINS = ["http://localhost:3002"];

export const frontendOrigins = (process.env.FRONTEND_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean)) ?? DEFAULT_FRONTEND_ORIGINS;

export const isSecureRequest = () => process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: isSecureRequest(),
  sameSite: (isSecureRequest() ? "none" : "lax") as "none" | "lax",
  maxAge: 1000 * 60 * 60 * 24,
  path: "/",
});
