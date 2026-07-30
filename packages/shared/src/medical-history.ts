import { z } from "zod";
import { stringRequired, numberFromString, numberOptional } from "./common.js";

// ──────────────────────────────────────────
// Medical History — treatments & prescriptions
// ──────────────────────────────────────────

export interface IMedicalHistory {
  _id: string;
  petId: string;
  visitDate: Date;
  diagnosis: string;
  doctorId: string;
  treatments: TreatmentItem[];
  prescriptions: PrescriptionItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentItem {
  productId: string;
  name: string;
  price: number;
  notes?: string;
}

export interface PrescriptionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  dosage?: string;
  notes?: string;
}

const treatmentItemSchema = z.object({
  productId: stringRequired,
  name: z.string(),
  price: numberFromString,
  notes: z.string().optional(),
});

const prescriptionItemSchema = z.object({
  productId: stringRequired,
  name: z.string(),
  quantity: z.preprocess((val) => Number(val), z.number().min(1)),
  price: numberFromString,
  dosage: z.string().optional(),
  notes: z.string().optional(),
});

export const medicalHistoryCreateSchema = z.object({
  petId: stringRequired,
  visitDate: z.coerce.date(),
  diagnosis: stringRequired,
  treatments: z.array(treatmentItemSchema).default([]),
  prescriptions: z.array(prescriptionItemSchema).default([]),
  notes: z.string().optional(),
});
export type MedicalHistoryCreateRequest = z.infer<typeof medicalHistoryCreateSchema>;

export const medicalHistoryUpdateSchema = medicalHistoryCreateSchema.partial();
export type MedicalHistoryUpdateRequest = z.infer<typeof medicalHistoryUpdateSchema>;

export const medicalHistoryFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  petId: z.string().optional(),
  doctorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["visitDate", "createdAt", "updatedAt"]).default("visitDate"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type MedicalHistoryFilter = z.infer<typeof medicalHistoryFilterSchema>;
