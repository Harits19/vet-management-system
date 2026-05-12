import mongoose, { Document } from "mongoose";
import { IPetMedicalHistory } from "../../../shared/types/pet_medical_history.type";

export interface PetMedicalHistory extends Document, IPetMedicalHistory {
  createdAt: Date;
  updatedAt: Date;
}

const PetMedicalHistorySchema = new mongoose.Schema<PetMedicalHistory>({
  petId: {
    type: String,
    required: true,
    trim: true,
  },
  visitDate: {
    type: Date,
    required: true,
  },
  complaints: {
    type: String,
    required: true,
    trim: true,
  },
  diagnosis: {
    type: String,
    trim: true,
  },
  treatments: {
    type: [String],
    required: true,
    default: [],
  },
  medications: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        dosage: {
          type: String,
          trim: true,
        },
        frequency: {
          type: String,
          trim: true,
        },
        duration: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    default: [],
  },
  vaccinations: {
    type: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          required: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    default: [],
  },
  allergies: {
    type: [String],
    default: [],
  },
  weight: {
    type: Number,
    min: 0,
  },
  temperature: {
    type: Number,
    min: 0,
  },
  attachments: {
    type: [
      {
        fileName: {
          type: String,
          required: true,
          trim: true,
        },
        fileUrl: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    default: [],
  },
  notes: {
    type: String,
    trim: true,
  },
  nextVisitDate: {
    type: Date,
  },
});
