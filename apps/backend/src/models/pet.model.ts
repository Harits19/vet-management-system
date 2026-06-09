import mongoose from "mongoose";
import { IPet } from "../../../shared/types/pet.type";


export const PetKey = 'Pet';

export interface Pet extends Omit<IPet, 'ownerId'> {
  createdAt: Date;
  updatedAt: Date;
  ownerId: mongoose.Schema.Types.ObjectId;
}

const PetSchema = new mongoose.Schema<Pet>(
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
    ownerId: {
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
