import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// User Schema
// ──────────────────────────────────────────
export const userRoleEnum = z.enum(["superadmin", "admin", "cashier", "doctor"] as const);
export type UserRole = z.infer<typeof userRoleEnum>;

export interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────
export const authLoginSchema = z.object({
  username: stringRequired,
  password: stringRequired,
});
export type AuthLoginRequest = z.infer<typeof authLoginSchema>;

export interface AuthLoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    username: string;
    role: UserRole;
  };
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}
