import { z } from "zod";
import { stringRequired, numberFromString } from "./common.js";

// ──────────────────────────────────────────
// Sale — physical product transactions
// ──────────────────────────────────────────
export interface ISale {
  _id: string;
  receiptNumber: string;
  timestamp: Date;
  paymentStatus: "paid" | "debt" | "dp";
  pricing: {
    cost: number;
    profit: number;
    total: number;
    selling: number;
  };
  additional: {
    serviceCharge: number;
    discount: number;
    tax: number;
    shipping: number;
  };
  summary: {
    total: number;
    downPayment: number;
    debt: number;
  };
  paymentMethod: string;
  customer?: string;
  cashier: {
    userId: string;
    name: string;
  };
  items: SaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  product: {
    _id: string;
    name: string;
    code?: string;
  };
  quantity: number;
  pricing: {
    cost: number;
    selling: number;
    total: number;
  };
}

const saleItemSchema = z.object({
  productId: stringRequired,
  quantity: z.preprocess((val) => Number(val), z.number().min(1, "Min 1")),
});

export const saleCreateSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: stringRequired,
  paidAmount: numberFromString,
  items: z.array(saleItemSchema).min(1, "Minimal 1 item"),
});
export type SaleCreateRequest = z.infer<typeof saleCreateSchema>;

export const saleFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().default(""),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  sortBy: z.enum(["timestamp", "receiptNumber", "summary.total", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type SaleFilter = z.infer<typeof saleFilterSchema>;
