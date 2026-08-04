import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// Pet — master data pasien (Single Source of Truth)
// ──────────────────────────────────────────
export interface IPet {
  _id: string;
  name: string;
  kind: string;
  breed?: string;
  furColor?: string;
  gender: "male" | "female";
  birthDate?: Date;
  initialAge?: { value: number; unit: "month" | "year" };
  notes?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const initialAgeSchema = z
  .object({
    value: z.preprocess((val) => Number(val), z.number().min(0)),
    unit: z.enum(["month", "year"]),
  })
  .optional();

export const petCreateSchema = z.object({
  name: stringRequired,
  kind: stringRequired,
  breed: z.string().trim().optional(),
  furColor: z.string().trim().optional(),
  gender: z.enum(["male", "female"]),
  birthDate: z.coerce.date().optional(),
  initialAge: initialAgeSchema,
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

// ──────────────────────────────────────────
// Age helpers — umur dihitung otomatis dari data pasien,
// TIDAK pernah diinput saat konsultasi.
// ──────────────────────────────────────────
export interface PetAgeInput {
  birthDate?: Date | string | null;
  initialAge?: { value: number; unit: "month" | "year" } | null;
  createdAt?: Date | string | null;
}

function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

export function computePetAge(pet: PetAgeInput): { months: number; label: string } | null {
  if (pet?.birthDate) {
    const birth = new Date(pet.birthDate);
    if (isNaN(birth.getTime())) return null;
    const months = Math.max(0, monthsBetween(birth, new Date()));
    return { months, label: formatAgeMonths(months) };
  }
  if (pet?.initialAge && typeof pet.initialAge.value === "number") {
    const base = pet.initialAge.unit === "year" ? pet.initialAge.value * 12 : pet.initialAge.value;
    // initialAge = umur saat createdAt → umur bertambah seiring waktu.
    // Fallback: tanpa createdAt, umur tetap statis (perilaku lama).
    let months = base;
    if (pet.createdAt) {
      const created = new Date(pet.createdAt);
      if (!isNaN(created.getTime())) {
        months += Math.max(0, monthsBetween(created, new Date()));
      }
    }
    return { months, label: formatAgeMonths(months) };
  }
  return null;
}

export function formatAgeMonths(months: number): string {
  if (months <= 0) return "< 1 bulan";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} bulan`;
  if (rest === 0) return `${years} tahun`;
  return `${years} tahun ${rest} bulan`;
}
