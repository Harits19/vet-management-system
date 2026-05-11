import { z } from "zod";
import { paginationQuerySchema } from "./pagination";
import { numberRequired, stringRequired } from "./zod";

const numberFromString = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  return Number(val);
}, z.number());

const salesPricingSchema = z.object({
  cost: numberRequired.optional(),
  selling: numberRequired,
  total: numberRequired,
});

const saleItemSchema = z.object({
  product: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama produk wajib"),
    code: z.string().optional(),
  }),

  quantity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Qty minimal 1"),
  ),

  pricing: salesPricingSchema,
});

export const mapSaleItem = (item: any) =>
  saleItemSchema.parse({
    product: {
      id: item.id_kproduk,
      name: item.nama,
      code: item.kode || undefined,
    },

    quantity: item.jumlah,

    pricing: {
      selling: item.hargajual,
      total: item.totalhargajual,
    },
  });

export const saleSchema = z.object({
  externalId: z.string(),

  receiptNumber: z.string(), // nostruk
  timestamp: z.coerce.date(),

  paymentStatus: z.string(), // bayar

  pricing: z.object({
    cost: numberFromString, // hargapokok
    profit: numberFromString, // laba
    total: numberFromString, // hargatotal
    selling: numberFromString, // hargajual
  }),

  additional: z.object({
    serviceCharge: numberFromString, // sc
    discount: numberFromString,
    tax: numberFromString,
    shipping: numberFromString, // ongkir
    rounding: numberFromString, // round
  }),

  summary: z.object({
    total: numberFromString, // totalharga
    downPayment: numberFromString, // uangmuka
    debt: numberFromString, // hutang
  }),

  paymentMethod: z.string(), // payment
  customer: z.string().optional().nullable(), // konsumen
  cashier: z.string(),
  // 🔥 CORE
  items: z.array(saleItemSchema).min(1, "Minimal 1 item"),
});




export const salesCreateSchema = saleSchema
  .pick({
    paymentMethod: true,
    customer: true,
  })
  .extend({
    paidAmount: numberRequired,
    customer: stringRequired.optional(),
    items: z.array(
      saleItemSchema.omit({ pricing: true }).extend({
        pricing: salesPricingSchema.omit({ total: true }),
      }),
    ),
  });

export interface SaleCreateRequest extends z.infer<typeof salesCreateSchema> { }

export const mapSales = (row: any, items: any[]): SaleSyncItem => {
  const result = saleSchema.parse({
    externalId: row.id,
    receiptNumber: row.nostruk,
    timestamp: row.timestamp,
    paymentStatus: row.bayar,
    pricing: {
      cost: row.hargapokok,
      profit: row.laba,
      total: row.hargatotal,
      selling: row.hargajual,
    },
    items: items.map(mapSaleItem),
    additional: {
      serviceCharge: row.sc,
      discount: row.diskon,
      tax: row.tax,
      shipping: row.ongkir,
      rounding: row.round,
    },

    summary: {
      total: row.totalharga,
      downPayment: row.uangmuka,
      debt: row.hutang,
    },

    paymentMethod: row.payment,
    customer: row.konsumen || null,
    cashier: row.kasir,
  });

  return result;
};

export const salesSortByList = [
  "receiptNumber",
  "timestamp",
  "pricing.cost",
  "pricing.profit",
  "pricing.selling",
  "pricing.total",
] as const;

export type SalesSortBy = (typeof salesSortByList)[number];

export const salesFilterSchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(salesSortByList).default("timestamp"),

  order: z.enum(["asc", "desc"]).default("desc"),
});

export interface SalesFilter extends z.infer<typeof salesFilterSchema> { }

export type ISale = z.infer<typeof saleSchema>;

export interface SaleSyncItem extends ISale {}


export const syncSchema = z.object({
  syncLatestOnly: z.boolean().optional(),
})

export interface ISync extends z.infer<typeof syncSchema> { }

export interface SyncRequest extends ISync { }

