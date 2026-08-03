import { z } from "zod";
import { stringRequired, numberFromString, numberOptional } from "./common.js";

// ──────────────────────────────────────────
// Transaction — unified shop + vet sales
// ──────────────────────────────────────────

export const transactionTypeEnum = z.enum(["shop", "vet"] as const);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

export const paymentStatusEnum = z.enum(["paid", "debt", "dp"] as const);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export interface ITransaction {
  _id: string;
  type: TransactionType;
  receiptNumber: string;
  timestamp: Date;
  customer?: { _id: string; name: string };
  pet?: { _id: string; name: string; kind: string };
  medicalHistoryId?: string;
  cashier: { _id: string; name: string };
  items: TransactionItem[];
  summary: { total: number; profit: number; cost: number; paid: number };
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  product: {
    _id: string;
    name: string;
    type: "physical" | "service";
    code?: string;
  };
  quantity: number;
  pricing: { cost?: number; selling: number; total: number };
  dosage?: string;
}

const txnProductSchema = z.object({
  _id: stringRequired,
  name: z.string(),
  type: z.enum(["physical", "service"]),
  code: z.string().optional(),
});

const txnItemSchema = z.object({
  product: txnProductSchema,
  quantity: z.preprocess((val) => Number(val), z.number().min(1)),
  pricing: z.object({
    cost: numberOptional,
    selling: numberFromString,
    total: numberFromString,
  }),
  dosage: z.string().optional(),
});

export const transactionCreateSchema = z.object({
  type: transactionTypeEnum.default("shop"),
  customerId: stringRequired.optional(),
  petId: z.string().optional(),
  medicalHistoryId: z.string().optional(),
  diagnosis: z.string().optional(),         // auto-create medical history for vet
  mhNotes: z.string().optional(),           // doctor notes for medical history
  paymentMethod: stringRequired,
  paidAmount: numberFromString,
  items: z.array(txnItemSchema).min(1, "Min 1 item"),
});
export type TransactionCreateRequest = z.infer<typeof transactionCreateSchema>;

export const transactionFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  type: transactionTypeEnum.optional(),
  petId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  sortBy: z.enum(["timestamp", "receiptNumber", "summary.total", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// ──────────────────────────────────────────
// Shop-specific create schema (simple productId + qty)
// ──────────────────────────────────────────
const shopItemSchema = z.object({
  productId: stringRequired,
  quantity: z.preprocess((val) => Number(val), z.number().min(1)),
});

export const shopCreateSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: stringRequired,
  paidAmount: numberFromString,
  items: z.array(shopItemSchema).min(1),
});
export type ShopCreateRequest = z.infer<typeof shopCreateSchema>;

// ──────────────────────────────────────────
// Pay debt — pembayaran transaksi yang masih hutang/DP
// ──────────────────────────────────────────
export const transactionPaySchema = z.object({
  paidAmount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive("Nominal harus lebih dari 0"),
  ),
  paymentMethod: stringRequired,
});
export type TransactionPayRequest = z.infer<typeof transactionPaySchema>;
