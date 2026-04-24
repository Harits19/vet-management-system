import { z } from "zod";

const numberFromString = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  return Number(val);
}, z.number());

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

});

export const mapSales = (row: any) => {
  return saleSchema.parse({
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
};


export type ISale = z.infer<typeof saleSchema>;