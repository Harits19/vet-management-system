import mongoose, { Schema } from "mongoose";

export interface ICustomerDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: Date;
  fromPetClinic?: boolean;
  updatedAt: Date;
  syncAt?: Date;
}

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    address: { type: String, trim: true },
    syncAt: { type: Date },
    fromPetClinic: { type: Boolean },
  },
  { timestamps: true, versionKey: false },
);

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ createdAt: -1 });

export const CustomerModel = mongoose.model<ICustomerDoc>(
  "Customer",
  CustomerSchema,
);
