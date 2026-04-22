import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../../shared/types/product";

export interface Product extends IProduct, Document {}

const ProductSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // biar boleh null tapi tetap unique
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    expiredDate: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProductModel = mongoose.model<Product>("Product", ProductSchema);
