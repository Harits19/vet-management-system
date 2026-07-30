import { z } from "zod";
import { stringRequired, numberFromString, numberOptional } from "./common.js";

// ──────────────────────────────────────────
// Vet Sale — unified service + product transaction
// ──────────────────────────────────────────

export const paymentStatusEnum = z.enum(["paid", "debt", "dp"] as const);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export interface IVetSale {
  _id: string;
  receiptNumber: string;
  timestamp: Date;
  customer: {
    _id: string;
    name: string;
  };
  pet?: {
    _id: string;
    name: string;
    kind: string;
  };
  medicalHistoryId?: string;
  cashier: {
    _id: string;
    name: string;
  };
  items: VetSaleItem[];
  summary: {
    total: number;
    profit: number;
    cost: number;
    paid: number;
  };
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VetSaleItem {
  product: {
    _id: string;
    name: string;
    type: "physical" | "service";
  };
  quantity: number;
  pricing: {
    cost?: number;
    selling: number;
    total: number;
  };
  dosage?: string;
}

const vetSaleProductSchema = z.object({
  _id: stringRequired,
  name: z.string(),
  type: z.enum(["physical", "service"]),
});

const vetSaleItemSchema = z.object({
  product: vetSaleProductSchema,
  quantity: z.preprocess((val) => Number(val), z.number().min(1)),
  pricing: z.object({
    cost: numberOptional,
    selling: numberFromString,
    total: numberFromString,
  }),
  dosage: z.string().optional(),
});

export const vetSaleCreateSchema = z.object({
  customerId: stringRequired,
  petId: z.string().optional(),
  medicalHistoryId: z.string().optional(),
  paymentMethod: stringRequired,
  paidAmount: numberFromString,
  items: z.array(vetSaleItemSchema).min(1, "Min 1 item"),
});
export type VetSaleCreateRequest = z.infer<typeof vetSaleCreateSchema>;

export const vetSaleFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  petId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["timestamp", "receiptNumber", "summary.total", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type VetSaleFilter = z.infer<typeof vetSaleFilterSchema>;
