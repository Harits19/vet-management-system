import mongoose, { Schema } from "mongoose";

// 6 jenis surat klinik
export const LETTER_TYPES = [
  "surgery",      // Surat Persetujuan Operasi
  "anesthesia",   // Surat Persetujuan Pembiusan
  "inpatient",    // Surat Persetujuan Rawat Inap
  "referral",     // Surat Rujukan
  "boarding",     // Surat Persetujuan Penitipan Hewan
  "euthanasia",   // Surat Persetujuan Euthanasia
] as const;
export type LetterType = (typeof LETTER_TYPES)[number];

export interface ILetterDoc {
  _id: mongoose.Types.ObjectId;
  letterType: LetterType;
  letterNumber: string;
  date: Date;
  petId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  subject?: string;          // topik utama per jenis (jenis operasi, tujuan rujukan, dll)
  notes?: string;            // catatan / risiko / keterangan
  ownerSignature?: string;   // tanda tangan digital pemilik (data URL PNG)
  ownerSignedName?: string;  // nama pemilik yang menandatangani
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LetterSchema = new Schema<ILetterDoc>(
  {
    letterType: { type: String, enum: LETTER_TYPES, required: true, index: true },
    letterNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    petId: { type: Schema.Types.ObjectId, required: true, ref: "Pet", index: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "Customer", index: true },
    doctorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    subject: { type: String, trim: true },
    notes: { type: String, trim: true },
    ownerSignature: { type: String },
    ownerSignedName: { type: String, trim: true },
    signedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

LetterSchema.index({ date: -1 });

export const LetterModel = mongoose.model<ILetterDoc>("Letter", LetterSchema);
