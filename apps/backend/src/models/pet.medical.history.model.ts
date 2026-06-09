import mongoose, { InferSchemaType, model, mongo, Schema } from "mongoose";
import { IPetMedicalHistory } from "../../../shared/types/pet.medical.history.type";
import { PetKey } from "./pet.model";
import { UserKey } from "./user.model";

export interface PetMedicalHistory extends Omit<IPetMedicalHistory, 'petId' | 'doctorId'> {
  petId: mongoose.Schema.Types.ObjectId;
  doctorId: mongoose.Schema.Types.ObjectId;
}


const medicalHistorySchema = new Schema<PetMedicalHistory>(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PetKey,
      required: true,
      index: true,
    },

    visitDate: {
      type: Date,
      required: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

    treatment: String,

    notes: String,

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserKey,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

medicalHistorySchema.index({
  petId: 1,
  visitDate: -1,
});

export type MedicalHistory = InferSchemaType<
  typeof medicalHistorySchema
>;

export const MedicalHistoryModel = model(
  'MedicalHistory',
  medicalHistorySchema
);