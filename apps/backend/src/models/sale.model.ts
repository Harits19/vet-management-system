import mongoose, { Document } from "mongoose";
import { ISale } from "../../../shared/types/sale.type";

export interface Sale extends ISale, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new mongoose.Schema<Sale>(
  {
    receiptNumber: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    paymentStatus: { type: String },

    pricing: {
      cost: { type: Number, default: 0 },
      profit: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      selling: { type: Number, default: 0 },
    },

    additional: {
      serviceCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      rounding: { type: Number, default: 0 },
    },

    summary: {
      total: { type: Number, default: 0 },
      downPayment: { type: Number, default: 0 },
      debt: { type: Number, default: 0 },
    },

    paymentMethod: { type: String },
    customer: { type: String },
    cashier: { type: String },

    externalId: { type: String, unique: true }, // id dari sistem luar
  },
  {
    timestamps: true,
  },
);

SaleSchema.index(
  {
    externalId: 1,
  },
  {
    unique: true,
  },
);

export const SaleModel = mongoose.model("Sale", SaleSchema);
