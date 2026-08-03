import { z } from "zod";
import { stringRequired, numberFromString, numberOptional } from "./common.js";

// ──────────────────────────────────────────
// Service (Jasa) — collection terpisah dari Barang (Product)
// ──────────────────────────────────────────
export interface IService {
  _id: string;
  name: string;
  description?: string;
  price: number; // harga jual
  cost?: number; // modal
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const serviceCreateSchema = z.object({
  name: stringRequired,
  description: z.string().optional(),
  price: numberFromString,
  cost: numberOptional,
});
export type ServiceCreateRequest = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = serviceCreateSchema.partial();
export type ServiceUpdateRequest = z.infer<typeof serviceUpdateSchema>;

export const serviceFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ServiceFilter = z.infer<typeof serviceFilterSchema>;
