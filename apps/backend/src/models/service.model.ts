import mongoose, { Schema } from "mongoose";

export interface IServiceDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  petClinicId?: string;
  syncAt?: Date;
}

const ServiceSchema = new Schema<IServiceDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    petClinicId: { type: String, trim: true },
    syncAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

ServiceSchema.index({ name: 1 });
ServiceSchema.index({ petClinicId: 1 }, { sparse: true, unique: true });

export const ServiceModel = mongoose.model<IServiceDoc>(
  "Service",
  ServiceSchema,
);
