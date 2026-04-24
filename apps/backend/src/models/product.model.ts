import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../../shared/types/product.type";

export interface Product extends IProduct, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },

    product: {
      code: {
        type: String,
        trim: true,
        sparse: true, // ✅ allow multiple null/undefined
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      weight: {
        type: Number,
        min: 0,
      },
    },

    pricing: {
      cost: {
        type: Number,
        required: true,
        min: 0,
      },
      selling: {
        type: Number,
        required: true,
        min: 0,
      },
      online: {
        type: Number,
        min: 0,
      },
    },

    inventory: {
      quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    unit: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
ProductSchema.index(
  {
    category: 1,
    "product.name": 1,
  },
  {
    unique: true,
    sparse: true, // penting kalau code optional
  },
);

export const ProductModel = mongoose.model("Product", ProductSchema);
