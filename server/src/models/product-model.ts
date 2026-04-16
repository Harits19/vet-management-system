import mongoose, { InferSchemaType, Model } from "mongoose";
import bcrypt from "bcrypt";

const productSchema = new mongoose.Schema(
  {
    createdAt: {
      type: String,
      required: true,
    },
    kategori: {
      type: String,
      required: true,
      trim: true,
    },
    kode: {
      type: String,
      required: true,
      trim: true,
    },
    deskripsi: {
      type: String,
      required: true,
      trim: true,
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    id: {
      type: String,
      required: true,
      trim: true,
    },
    stok: {
      type: Number,
      required: true,
    },
    pokok: {
      type: Number,
      required: true,
    },
    jual: {
      type: Number,
      required: true,
    },
    online: {
      type: Number,
      required: true,
    },
    tampil: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.methods.verifyPassword = function verifyPassword(
  password: string,
) {
  return bcrypt.compare(password, this.passwordHash);
};

type ProductDocument = InferSchemaType<typeof productSchema> & {
  verifyPassword(password: string): Promise<boolean>;
};

export type ProductModel = Model<ProductDocument>;

export const ProductDB =
  (mongoose.models.Product as ProductModel | undefined) ||
  mongoose.model<ProductDocument>("Product", productSchema);
