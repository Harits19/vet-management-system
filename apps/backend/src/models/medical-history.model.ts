import mongoose, { Schema } from "mongoose";

// ──────────────────────────────────────────
// SOAP sub-schemas
// Objective bersifat extensible: physicalExam adalah array
// { key, label, value, unit } — parameter baru (heartRate, BCS, dll)
// ditambahkan tanpa perubahan schema.
// ──────────────────────────────────────────
export interface IPhysicalExamSubDoc {
  key: string;
  label: string;
  value?: number;
  unit?: string;
}

export interface ISoapSubDoc {
  subjective: { complaint: string };
  objective: { physicalExam: IPhysicalExamSubDoc[]; labResult?: string };
  assessment: { differentialDiagnosis: string; physicalExamNote?: string };
  plan: {
    treatmentPlan: string;
    doctorNotes?: string;
    ownerNote?: string;
    paramedicNote?: string;
  };
}

export interface ITreatmentSubDoc {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface IPrescriptionSubDoc {
  productId?: mongoose.Types.ObjectId; // kosong = obat bebas (diketik manual, tanpa master)
  name: string;
  quantity: number;
  price: number;
  dosage?: string;
  usage?: string;
  notes?: string;
  unit?: string; // Satuan (mis. "Unit", "Tablet")
  amount?: number; // Jumlah obat (bisa desimal, mis. 0.5)
  usageTime?: string; // Waktu penggunaan (mis. "2 dd 1")
  usageInstruction?: string; // Instruksi penggunaan (mis. "tab", "cth")
  usageNote?: string; // Catatan penggunaan
}

export interface IMedicalHistoryDoc {
  _id: mongoose.Types.ObjectId;
  petId: mongoose.Types.ObjectId;
  visitDate?: Date;
  soap?: ISoapSubDoc; // optional utk toleransi data lama
  diagnosis: string;
  doctorId: mongoose.Types.ObjectId;
  treatments: ITreatmentSubDoc[];
  prescriptions: IPrescriptionSubDoc[];
  goods: ITreatmentSubDoc[];
  createdAt: Date;
  updatedAt: Date;
  petClinicId?: string;
  syncAt?: Date;
}

const PhysicalExamSubSchema = new Schema<IPhysicalExamSubDoc>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: Number, min: 0 },
    unit: { type: String },
  },
  { _id: false },
);

const SoapSubSchema = new Schema<ISoapSubDoc>(
  {
    subjective: {
      complaint: { type: String, required: true },
    },
    objective: {
      physicalExam: { type: [PhysicalExamSubSchema], default: [] },
      labResult: { type: String },
    },
    assessment: {
      differentialDiagnosis: { type: String, required: true },
      physicalExamNote: { type: String },
    },
    plan: {
      treatmentPlan: { type: String, required: true },
      doctorNotes: { type: String },
      ownerNote: { type: String },
      paramedicNote: { type: String },
    },
  },
  { _id: false },
);

const TreatmentSubSchema = new Schema<ITreatmentSubDoc>(
  {
    productId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { _id: false },
);

const PrescriptionSubSchema = new Schema<IPrescriptionSubDoc>(
  {
    // productId kosong = obat bebas (diketik manual di konsultasi, tanpa stok/harga)
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    dosage: { type: String },
    usage: { type: String },
    notes: { type: String },
    unit: { type: String },
    amount: { type: Number, min: 0 },
    usageTime: { type: String },
    usageInstruction: { type: String },
    usageNote: { type: String },
  },
  { _id: false },
);

const MedicalHistorySchema = new Schema<IMedicalHistoryDoc>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Pet",
      index: true,
    },
    visitDate: { type: Date, required: true },
    soap: { type: SoapSubSchema },
    diagnosis: { type: String, required: true },
    doctorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    treatments: { type: [TreatmentSubSchema], default: [] },
    prescriptions: { type: [PrescriptionSubSchema], default: [] },
    goods: { type: [TreatmentSubSchema], default: [] },
    petClinicId: { type: String, trim: true },
    syncAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

MedicalHistorySchema.index({ petId: 1, visitDate: -1 });
MedicalHistorySchema.index({ petClinicId: 1 }, { sparse: true, unique: true });

export const MedicalHistoryModel = mongoose.model<IMedicalHistoryDoc>(
  "MedicalHistory",
  MedicalHistorySchema,
);
