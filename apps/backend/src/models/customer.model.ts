import mongoose, { Document, InferSchemaType } from "mongoose";
import { ICustomer } from "../../../shared/types/customer.type";
import { BaseFilter, buildFilterSchema } from "./filter.model";
import { NestedKeys } from "../../../shared/types/common.type";


export const CustomerKey = 'Customer';
export interface Customer extends ICustomer {
};

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


export const CustomerModel = mongoose.model(CustomerKey, CustomerSchema);


export const customerListFilterSchema = buildFilterSchema<Customer>({
  sortList: ['name', 'createdAt', 'updatedAt'],
  defaultSort: 'createdAt',
})


