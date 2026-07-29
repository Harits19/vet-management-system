import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// Pet
// ──────────────────────────────────────────
export interface IPet {
  _id: string;
  name: string;
  kind: string;
  gender: "male" | "female";
  notes?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const petCreateSchema = z.object({
  name: stringRequired,
  kind: stringRequired,
  gender: z.enum(["male", "female"]),
  notes: z.string().optional(),
  customerId: stringRequired,
});
export type PetCreateRequest = z.infer<typeof petCreateSchema>;

export const petUpdateSchema = petCreateSchema.partial();
export type PetUpdateRequest = z.infer<typeof petUpdateSchema>;

export const petFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  customerId: z.string().optional(),
  sortBy: z.enum(["name", "kind", "createdAt", "updatedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type PetFilter = z.infer<typeof petFilterSchema>;
