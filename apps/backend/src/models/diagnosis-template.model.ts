import mongoose, { Schema } from "mongoose";

export interface IDiagnosisTemplateItem {
  productId: mongoose.Types.ObjectId;
  name: string; // snapshot nama (untuk tampilan di halaman list diagnosis)
  quantity: number;
  dosage?: string; // hanya untuk obat
}

export interface IDiagnosisTemplateDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  items: {
    treatments: IDiagnosisTemplateItem[];
    prescriptions: IDiagnosisTemplateItem[];
    goods: IDiagnosisTemplateItem[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TemplateItemSchema = new Schema<IDiagnosisTemplateItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    dosage: { type: String, trim: true },
  },
  { _id: false }
);

const DiagnosisTemplateSchema = new Schema<IDiagnosisTemplateDoc>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    items: {
      treatments: { type: [TemplateItemSchema], default: [] },
      prescriptions: { type: [TemplateItemSchema], default: [] },
      goods: { type: [TemplateItemSchema], default: [] },
    },
  },
  { timestamps: true, versionKey: false }
);

DiagnosisTemplateSchema.index({ name: 1 });

export const DiagnosisTemplateModel = mongoose.model<IDiagnosisTemplateDoc>("DiagnosisTemplate", DiagnosisTemplateSchema);
