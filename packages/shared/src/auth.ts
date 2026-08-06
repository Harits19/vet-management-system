import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// User Schema
// ──────────────────────────────────────────
export const userRoleEnum = z.enum(["superadmin", "admin", "cashier", "doctor"] as const);
export type UserRole = z.infer<typeof userRoleEnum>;

// ──────────────────────────────────────────
// User management (CRUD akun login)
// ──────────────────────────────────────────
export const userCreateSchema = z.object({
  name: stringRequired,
  username: stringRequired,
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: userRoleEnum,
  isActive: z.boolean().default(true),
});
export type UserCreateRequest = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: stringRequired,
  username: stringRequired,
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: userRoleEnum,
  isActive: z.boolean(),
});
export type UserUpdateRequest = z.infer<typeof userUpdateSchema>;

export const userFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  sortBy: z.enum(["name", "username", "role", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type UserFilter = z.infer<typeof userFilterSchema>;

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
