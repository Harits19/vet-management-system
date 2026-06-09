import mongoose from "mongoose";
import { IPet, petCreateSchema } from "../../../shared/types/pet.type";


export const PetKey = 'Pet';

export interface PetModel extends Omit<IPet, 'customerId'> {
  createdAt: Date;
  updatedAt: Date;
  customerId: mongoose.Schema.Types.ObjectId;
}

const PetSchema = new mongoose.Schema<PetModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
      ref: 'Customer',
    },
  },
  {
    timestamps: true,
  },
);

export const PetModel = mongoose.model(PetKey, PetSchema);


