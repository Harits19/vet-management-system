import mongoose from "mongoose";
import { IVetSale } from "../../../shared/types/vet.sale.type";

export interface VetSale extends IVetSale {

}


const VetSaleSchema = new mongoose.Schema<VetSale>(
  {
    _id: {
      type: mongoose.Schema.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: new mongoose.Schema<IVetSale['customer']>({
        id: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: 'Customer',
        },
        name: {
          type: String,
          required: true,
        },
      }),
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
    cashier: {
      type: new mongoose.Schema<VetSale['cashier']>({
        id: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: 'User',
        },
        name: {
          type: String,
          required: true,
        },

      }),
      required: true,
    },
    summary: {
      type: new mongoose.Schema<VetSale['summary']>({
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        profit: {
          type: Number,
          required: true,
          min: 0,
        }
      }),
      required: true,
    }
  },
  {
    timestamps: true,
  },
);


export const VetSaleDB = mongoose.model("VetSale", VetSaleSchema);


