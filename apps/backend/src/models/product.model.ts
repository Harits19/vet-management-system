import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  barcode?: string;
  category: string;
  cost_price: number;
  sell_price: number;
  stock: number;
  unit: string;
  expired_date?: Date;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
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

    cost_price: {
      type: Number,
      required: true,
      min: 0,
    },

    sell_price: {
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

    expired_date: {
      type: Date,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
