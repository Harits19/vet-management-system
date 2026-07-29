import mongoose, { Schema } from "mongoose";

export interface IPetDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  kind: string;
  gender: "male" | "female";
  notes?: string;
  customerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema = new Schema<IPetDoc>(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["male", "female"] },
    notes: { type: String, trim: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "Customer", index: true },
  },
  { timestamps: true, versionKey: false }
);

PetSchema.index({ name: 1 });
PetSchema.index({ customerId: 1, name: 1 });

export const PetModel = mongoose.model<IPetDoc>("Pet", PetSchema);
