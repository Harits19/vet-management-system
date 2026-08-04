import { z } from "zod";
import { stringRequired } from "./common.js";

// ──────────────────────────────────────────
// Diagnosis Template — master list diagnosis + template item (jasa/obat/barang)
// Item template hanya menyimpan productId + name (snapshot utk tampilan) + quantity
// (+ dosage utk obat). Harga/satuan TIDAK disimpan — di-GET dari master saat dipakai.
// ──────────────────────────────────────────
export interface DiagnosisTemplateItem {
  productId: string;
  name: string; // snapshot — untuk tampilan di halaman list diagnosis
  quantity: number;
  dosage?: string; // hanya untuk obat (prescriptions)
}

export interface IDiagnosisTemplate {
  _id: string;
  name: string;
  items: {
    treatments: DiagnosisTemplateItem[]; // Jasa — dari ServiceModel
    prescriptions: DiagnosisTemplateItem[]; // Obat — dari ProductModel (medicine)
    goods: DiagnosisTemplateItem[]; // Barang — dari ProductModel (good)
  };
  createdAt: Date;
  updatedAt: Date;
}

const templateItemSchema = z.object({
  productId: stringRequired,
  name: z.string(),
  quantity: z.preprocess((val) => Number(val), z.number().min(1)).default(1),
  dosage: z.string().optional(),
});

export const diagnosisTemplateCreateSchema = z.object({
  name: stringRequired,
  items: z
    .object({
      treatments: z.array(templateItemSchema).default([]),
      prescriptions: z.array(templateItemSchema).default([]),
      goods: z.array(templateItemSchema).default([]),
    })
    .default({ treatments: [], prescriptions: [], goods: [] }),
});
export type DiagnosisTemplateCreateRequest = z.infer<typeof diagnosisTemplateCreateSchema>;

export const diagnosisTemplateUpdateSchema = diagnosisTemplateCreateSchema.partial();
export type DiagnosisTemplateUpdateRequest = z.infer<typeof diagnosisTemplateUpdateSchema>;

export const diagnosisTemplateFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
});
export type DiagnosisTemplateFilter = z.infer<typeof diagnosisTemplateFilterSchema>;
