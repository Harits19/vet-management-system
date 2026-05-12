import mongoose, { Document } from "mongoose";
import { IPet } from "../../../shared/types/pet.type";

export interface Pet extends IPet, Document {
  createdAt: Date;
  updatedAt: Date;
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
      type: String,
      required: true,
      trim: true,
      ref: "Customer",
    },
  },
  {
    timestamps: true,
  },
);

export const CustomerModel = mongoose.model("Pet", PetSchema);
