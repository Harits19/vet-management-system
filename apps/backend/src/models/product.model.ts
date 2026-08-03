import mongoose, { Schema } from "mongoose";
import type { ProductType } from "@vet/shared";

export interface IProductDoc {
  _id: mongoose.Types.ObjectId;
  productType: ProductType;
  category: string;
  product: {
    code?: string;
    name: string;
    weight?: number;
    supplier?: string;
    petClinicId?: string;
  };
  pricing: {
    cost?: number;
    selling: number;
    online?: number;
  };
  inventory: {
    quantity?: number;
  };
  unit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncAt?: Date;
}

const ProductSchema = new Schema<IProductDoc>(
  {
    productType: { type: String, enum: ["medicine", "good"], required: true, default: "good" },
    category: { type: String, required: true, trim: true },
    product: {
      code: { type: String, trim: true, sparse: true },
      name: { type: String, required: true, trim: true },
      weight: { type: Number, min: 0 },
      supplier: { type: String },
      petClinicId: { type: String, trim: true, sparse: true }
    },
    pricing: {
      cost: { type: Number, min: 0 },
      selling: { type: Number, required: true, min: 0 },
      online: { type: Number, min: 0 },
    },
    inventory: {
      quantity: { type: Number, min: 0 },
    },
    unit: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    syncAt: { type: Date, }
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.index({ "product.name": 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ "product.petClinicId": 1 }, { unique: true, sparse: true });

export const ProductModel = mongoose.model<IProductDoc>("Product", ProductSchema);
