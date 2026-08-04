import mongoose, { Schema } from "mongoose";
import type { TransactionType, PaymentStatus } from "@vet/shared";

export interface ITransactionItemDoc {
  product: {
    _id: mongoose.Types.ObjectId;
    name: string;
    type: "physical" | "service";
    code?: string;
  };
  quantity: number;
  pricing: { cost?: number; selling: number; total: number };
  dosage?: string;
  stockDelta?: number; // stok fisik yang benar-benar terpotong; bisa < quantity saat stok kurang (tidak pernah minus)
}

export interface ITransactionDoc {
  _id: mongoose.Types.ObjectId;
  type: TransactionType;
  receiptNumber: string;
  timestamp: Date;
  customer?: { _id: mongoose.Types.ObjectId; name: string };
  pet?: { _id: mongoose.Types.ObjectId; name: string; kind: string };
  medicalHistoryId?: mongoose.Types.ObjectId;
  cashier: { _id: mongoose.Types.ObjectId; name: string };
  items: ITransactionItemDoc[];
  summary: { total: number; profit: number; cost: number; paid: number };
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const TxnItemSubSchema = new Schema<ITransactionItemDoc>(
  {
    product: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
      name: { type: String, required: true },
      type: { type: String, enum: ["physical", "service"], required: true },
      code: { type: String },
    },
    quantity: { type: Number, required: true, min: 1 },
    pricing: {
      cost: { type: Number, min: 0 },
      selling: { type: Number, required: true, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    dosage: { type: String },
    stockDelta: { type: Number, min: 0 },
  },
  { _id: false },
);

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    type: {
      type: String,
      enum: ["shop", "vet"],
      required: true,
      default: "shop",
    },
    receiptNumber: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    customer: {
      _id: { type: Schema.Types.ObjectId, ref: "Customer" },
      name: { type: String },
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
    items: {
      type: [TxnItemSubSchema],
      required: true,
      validate: [(v: ITransactionItemDoc[]) => v.length > 0, "Min 1 item"],
    },
    summary: {
      total: { type: Number, default: 0 },
      profit: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "debt", "dp"],
      required: true,
    },
    paymentMethod: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

TransactionSchema.index({ type: 1, timestamp: -1 });
TransactionSchema.index({ receiptNumber: 1 });
TransactionSchema.index({ "customer._id": 1 });

export const TransactionModel = mongoose.model<ITransactionDoc>(
  "Transaction",
  TransactionSchema,
);
