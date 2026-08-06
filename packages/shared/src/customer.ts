import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// Customer
// ──────────────────────────────────────────
export interface ICustomer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  hamlet?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const customerCreateSchema = z.object({
  name: stringRequired,
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().optional(),
  province: z.string().trim().optional(),
  regency: z.string().trim().optional(),
  district: z.string().trim().optional(),
  village: z.string().trim().optional(),
  hamlet: z.string().trim().optional(),
});
export type CustomerCreateRequest = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial();
export type CustomerUpdateRequest = z.infer<typeof customerUpdateSchema>;

// Filter / pagination
export const customerFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type CustomerFilter = z.infer<typeof customerFilterSchema>;
