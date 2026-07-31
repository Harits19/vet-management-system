import { z } from "zod";
import { stringRequired, numberFromString } from "./common.js";

// ──────────────────────────────────────────
// Medical History — SOAP + Diagnosis + Tindakan + Resep Obat
// ──────────────────────────────────────────

// Objective bersifat extensible: parameter pemeriksaan fisik disimpan
// sebagai array { key, label, value, unit }. Menambah parameter baru
// (heartRate, respiratoryRate, CRT, BCS, dll) cukup menambah item —
// TANPA perubahan schema database.
export const PHYSICAL_EXAM_KEYS = {
  WEIGHT: "weight",
  TEMPERATURE: "temperature",
} as const;

export interface PhysicalExamItem {
  key: string;
  label: string;
  value?: number;
  unit?: string;
}

export interface SoapData {
  subjective: {
    complaint: string; // Keluhan
  };
  objective: {
    physicalExam: PhysicalExamItem[]; // Pemeriksaan Fisik (Berat Badan, Suhu, dll)
    labResult?: string; // O — Hasil Pemeriksaan Laboratorium
  };
  assessment: {
    differentialDiagnosis: string; // Diagnosis Banding
    physicalExamNote?: string; // A — Pemeriksaan Fisik (catatan text area)
  };
  plan: {
    treatmentPlan: string; // Rencana Penanganan
    doctorNotes?: string; // Catatan Dokter
    ownerNote?: string; // P — Catatan Dokter Untuk Pemilik
    paramedicNote?: string; // P — Catatan Dokter Untuk Paramedis
  };
}

export interface TreatmentItem {
  productId: string;
  name: string;
  quantity: number; // Jumlah
  price: number; // Harga
  notes?: string; // Catatan
}

export interface PrescriptionItem {
  productId: string;
  name: string;
  quantity: number; // Jumlah
  price: number; // Harga (dari master obat)
  dosage?: string; // Dosis
  usage?: string; // Aturan Pakai
  notes?: string; // Catatan
}

export interface IMedicalHistory {
  _id: string;
  petId: string;
  visitDate: Date;
  soap: SoapData;
  diagnosis: string; // Penegakan Diagnosis (di luar SOAP)
  doctorId: string;
  treatments: TreatmentItem[]; // Tindakan (jasa)
  prescriptions: PrescriptionItem[]; // Resep Obat (obat/medicine)
  goods: TreatmentItem[]; // Barang non-obat (good)
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────
// Zod schemas
// ──────────────────────────────────────────
const physicalExamItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.number().optional(),
  unit: z.string().optional(),
});

const treatmentItemSchema = z.object({
  productId: stringRequired,
  name: z.string(),
  quantity: z.preprocess((val) => Number(val), z.number().min(1)).default(1),
  price: numberFromString,
  notes: z.string().optional(),
});

const prescriptionItemSchema = z.object({
  productId: stringRequired,
  name: z.string(),
  quantity: z.preprocess((val) => Number(val), z.number().min(1)),
  price: numberFromString,
  dosage: z.string().optional(),
  usage: z.string().optional(),
  notes: z.string().optional(),
});

export const soapSchema = z.object({
  subjective: z.object({
    complaint: stringRequired,
  }),
  objective: z.object({
    physicalExam: z.array(physicalExamItemSchema).default([]),
    labResult: z.string().optional(),
  }),
  assessment: z.object({
    differentialDiagnosis: stringRequired,
    physicalExamNote: z.string().optional(),
  }),
  plan: z.object({
    treatmentPlan: stringRequired,
    doctorNotes: z.string().optional(),
    ownerNote: z.string().optional(),
    paramedicNote: z.string().optional(),
  }),
});
export type SoapRequest = z.infer<typeof soapSchema>;

export const medicalHistoryCreateSchema = z.object({
  petId: stringRequired,
  visitDate: z.coerce.date(),
  soap: soapSchema,
  diagnosis: stringRequired,
  treatments: z.array(treatmentItemSchema).default([]),
  prescriptions: z.array(prescriptionItemSchema).default([]),
  goods: z.array(treatmentItemSchema).default([]),
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
