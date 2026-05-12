import mongoose, { Document } from "mongoose";
import { ICustomer } from "../../../shared/types/customer.type";

export interface Customer extends ICustomer, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new mongoose.Schema<Customer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CustomerModel = mongoose.model("Customer", CustomerSchema);
