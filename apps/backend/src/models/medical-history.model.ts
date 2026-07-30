import mongoose, { Schema } from "mongoose";

export interface ITreatmentSubDoc {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  notes?: string;
}

export interface IPrescriptionSubDoc {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  dosage?: string;
  notes?: string;
}

export interface IMedicalHistoryDoc {
  _id: mongoose.Types.ObjectId;
  petId: mongoose.Types.ObjectId;
  visitDate: Date;
  diagnosis: string;
  doctorId: mongoose.Types.ObjectId;
  treatments: ITreatmentSubDoc[];
  prescriptions: IPrescriptionSubDoc[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreatmentSubSchema = new Schema<ITreatmentSubDoc>(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { _id: false }
);

const PrescriptionSubSchema = new Schema<IPrescriptionSubDoc>(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    dosage: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const MedicalHistorySchema = new Schema<IMedicalHistoryDoc>(
  {
    petId: { type: Schema.Types.ObjectId, required: true, ref: "Pet", index: true },
    visitDate: { type: Date, required: true },
    diagnosis: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    treatments: { type: [TreatmentSubSchema], default: [] },
    prescriptions: { type: [PrescriptionSubSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true, versionKey: false }
);

MedicalHistorySchema.index({ petId: 1, visitDate: -1 });

export const MedicalHistoryModel = mongoose.model<IMedicalHistoryDoc>("MedicalHistory", MedicalHistorySchema);
