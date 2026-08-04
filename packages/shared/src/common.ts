import { z } from "zod";

// ──────────────────────────────────────────
// Common helpers
// ──────────────────────────────────────────
export const stringRequired = z.string().trim().min(1, "Required");
export const numberFromString = z.preprocess(
  (val) =>
    val === "" || val === null || val === undefined ? undefined : Number(val),
  z.number().min(0),
);
export const numberOptional = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}, z.number().min(0).optional());

// ──────────────────────────────────────────
// Common API response shape
// ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function stringToDate(value?: string) {
  if (!value) return;
  
  return new Date(value);
}
