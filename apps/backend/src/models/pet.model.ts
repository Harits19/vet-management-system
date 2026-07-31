import mongoose, { Schema } from "mongoose";

export interface IPetDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  kind: string;
  breed?: string;
  gender: "male" | "female";
  birthDate?: Date;
  initialAge?: { value: number; unit: "month" | "year" };
  notes?: string;
  customerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InitialAgeSubSchema = new Schema(
  {
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["month", "year"] },
  },
  { _id: false }
);

const PetSchema = new Schema<IPetDoc>(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    gender: { type: String, required: true, enum: ["male", "female"] },
    birthDate: { type: Date },
    initialAge: { type: InitialAgeSubSchema },
    notes: { type: String, trim: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "Customer", index: true },
  },
  { timestamps: true, versionKey: false }
);

PetSchema.index({ name: 1 });
PetSchema.index({ customerId: 1, name: 1 });

export const PetModel = mongoose.model<IPetDoc>("Pet", PetSchema);
