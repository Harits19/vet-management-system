import mongoose, { Schema } from "mongoose";
import type { PaymentStatus } from "@vet/shared";

export interface IVetSaleItemDoc {
  product: {
    _id: mongoose.Types.ObjectId;
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

export interface IVetSaleDoc {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;
  timestamp: Date;
  customer: { _id: mongoose.Types.ObjectId; name: string };
  pet?: { _id: mongoose.Types.ObjectId; name: string; kind: string };
  medicalHistoryId?: mongoose.Types.ObjectId;
  cashier: { _id: mongoose.Types.ObjectId; name: string };
  items: IVetSaleItemDoc[];
  summary: { total: number; profit: number; cost: number; paid: number };
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const VetSaleItemSubSchema = new Schema<IVetSaleItemDoc>(
  {
    product: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
      name: { type: String, required: true },
      type: { type: String, enum: ["physical", "service"], required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    pricing: {
      cost: { type: Number, min: 0 },
      selling: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    dosage: { type: String },
  },
  { _id: false }
);

const VetSaleSchema = new Schema<IVetSaleDoc>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: Date.now },
    customer: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "Customer" },
      name: { type: String, required: true },
    },
    pet: {
      _id: { type: Schema.Types.ObjectId, ref: "Pet" },
      name: { type: String },
      kind: { type: String },
    },
    medicalHistoryId: { type: Schema.Types.ObjectId, ref: "MedicalHistory" },
    cashier: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      name: { type: String, required: true },
    },
    items: { type: [VetSaleItemSubSchema], required: true, validate: [(v: IVetSaleItemDoc[]) => v.length > 0, "Min 1 item"] },
    summary: {
      total: { type: Number, default: 0 },
      profit: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
    },
    paymentStatus: { type: String, enum: ["paid", "debt", "dp"], required: true },
    paymentMethod: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

VetSaleSchema.index({ timestamp: -1 });
VetSaleSchema.index({ receiptNumber: 1 });

export const VetSaleModel = mongoose.model<IVetSaleDoc>("VetSale", VetSaleSchema);
