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
    email: string;
    role: UserRole;
  };
}

// Update profil user yang login (nama, username, email, dan ganti password opsional)
export const authUpdateProfileSchema = z
  .object({
    name: stringRequired,
    username: stringRequired,
    email: z.string().trim().email("Email tidak valid"),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter").optional(),
  })
  .refine((v) => !v.newPassword || v.currentPassword, {
    message: "Password lama wajib diisi untuk mengganti password",
    path: ["currentPassword"],
  });
export type AuthUpdateProfileRequest = z.infer<typeof authUpdateProfileSchema>;

export interface AuthUpdateProfileResponse {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  doctorSignature?: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}
