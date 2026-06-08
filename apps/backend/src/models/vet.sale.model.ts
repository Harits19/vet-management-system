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
        _id: {
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
        _id: {
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
    items: {
      type: [new mongoose.Schema<VetSale['items'][0]>({
        product: {
          type: new mongoose.Schema<VetSale['items'][0]['product']>({
            _id: {
              type: mongoose.Schema.ObjectId,
              required: true,
              ref: 'Product',
            },
            name: {
              type: String,
              required: true,
            },
          }),
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        pricing: {
          type: new mongoose.Schema<VetSale['items'][0]['pricing']>({
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
            total: {
              type: Number,
              required: true,
              min: 0,
            },
          }),
          required: true,
        }
      }, { _id: false })],
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
        },
        cost: {
          type: Number,
          required: true,
          min: 0,
        },
        paid: {
          type: Number,
          required: true,
          min: 0,
        }
      }, { _id: false }),
      required: true,
    }
  },
  {
    timestamps: true,
  },
);


export const VetSaleDB = mongoose.model("VetSale", VetSaleSchema);


