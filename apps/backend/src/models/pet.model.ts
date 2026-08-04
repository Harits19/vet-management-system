import mongoose, { Schema } from "mongoose";

const IPetDocInitialAgeUnitList = ["month", "year"] as const;
export type IPetDocInitialAgeUnit = (typeof IPetDocInitialAgeUnitList)[number];
export interface IPetDocInitialAge {
  value: number;
  unit: IPetDocInitialAgeUnit;
  range?: number;
}
export interface IPetDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  kind: string;
  breed?: string;
  furColor?: string;
  code?: string;
  syncAt?: Date;
  gender: "male" | "female";
  birthDate?: Date;
  initialAge?: IPetDocInitialAge;
  notes?: string;
  customerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  petClinicId: string;
  isActive?: boolean;
}

const InitialAgeSubSchema = new Schema<IPetDocInitialAge>(
  {
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: IPetDocInitialAgeUnitList },
    range: { type: Number, required: false },
  },
  { _id: false },
);

const PetSchema = new Schema<IPetDoc>(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, required: true, trim: true },
    breed: { type: String, trim: true },
    gender: { type: String, required: true, enum: ["male", "female"] },
    birthDate: { type: Date },
    furColor: { type: String, trim: true },
    syncAt: { type: Date },
    code: { type: String },
    initialAge: { type: InitialAgeSubSchema },
    notes: { type: String, trim: true },
    petClinicId: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

PetSchema.index({ name: 1 });
PetSchema.index({ customerId: 1, name: 1 });
PetSchema.index({ petClinicId: 1 }, { sparse: true, unique: true });

export const PetModel = mongoose.model<IPetDoc>("Pet", PetSchema);
