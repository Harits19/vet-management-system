import mongoose, { Schema } from "mongoose";

export interface ICustomerDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ createdAt: -1 });

export const CustomerModel = mongoose.model<ICustomerDoc>("Customer", CustomerSchema);
