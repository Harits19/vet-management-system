import mongoose, { Schema } from "mongoose";

export interface ISaleItem {
  product: { _id: mongoose.Types.ObjectId; name: string; code?: string };
  quantity: number;
  pricing: { cost: number; selling: number; total: number };
}

export interface ISaleDoc {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;
  timestamp: Date;
  paymentStatus: "paid" | "debt" | "dp";
  pricing: { cost: number; profit: number; total: number; selling: number };
  additional: { serviceCharge: number; discount: number; tax: number; shipping: number };
  summary: { total: number; downPayment: number; debt: number };
  paymentMethod: string;
  customer?: mongoose.Types.ObjectId;
  cashier: { userId: mongoose.Types.ObjectId; name: string };
  items: ISaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSubSchema = new Schema<ISaleItem>(
  {
    product: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
      name: { type: String, required: true },
      code: { type: String },
    },
    quantity: { type: Number, required: true, min: 1 },
    pricing: {
      cost: { type: Number, default: 0 },
      selling: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISaleDoc>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: Date.now },
    paymentStatus: { type: String, enum: ["paid", "debt", "dp"], required: true },
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
    },
    summary: {
      total: { type: Number, default: 0 },
      downPayment: { type: Number, default: 0 },
      debt: { type: Number, default: 0 },
    },
    paymentMethod: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    cashier: {
      userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      name: { type: String, required: true },
    },
    items: { type: [SaleItemSubSchema], required: true, validate: [(v: ISaleItem[]) => v.length > 0, "Min 1 item"] },
  },
  { timestamps: true, versionKey: false }
);

SaleSchema.index({ timestamp: -1 });
SaleSchema.index({ receiptNumber: 1 });

export const SaleModel = mongoose.model<ISaleDoc>("Sale", SaleSchema);
