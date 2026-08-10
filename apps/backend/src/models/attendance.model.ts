import mongoose, { Schema } from "mongoose";

export const AttendanceKey = "Attendance";

export interface IAttendanceDoc extends Document {
  userId: mongoose.Types.ObjectId;
  method: "face" | "qr";
  type: "in" | "out";
  timestamp: Date;
  date: string; // YYYY-MM-DD (zona Indonesia, UTC+7)
  location?: { lat: number; lng: number; accuracy?: number };
  faceDistance?: number; // jarak euclidean descriptor saat verifikasi wajah
  livenessPassed: boolean;
}

const AttendanceSchema = new Schema<IAttendanceDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    method: { type: String, enum: ["face", "qr"], default: "face", required: true },
    type: { type: String, enum: ["in", "out"], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    date: { type: String, required: true, index: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
    },
    faceDistance: { type: Number },
    livenessPassed: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

AttendanceSchema.index({ userId: 1, date: 1, type: 1 });

export const AttendanceModel = mongoose.model<IAttendanceDoc>(AttendanceKey, AttendanceSchema);
