import mongoose, { Schema } from "mongoose";

export const AttendanceQrKey = "AttendanceQr";

export interface IAttendanceQrDoc extends Document {
  key: string; // "attendance-qr" — dokumen singleton
  secret: string; // secret QR absen (isi QR = "VET-ABSEN:<secret>")
  updatedBy?: mongoose.Types.ObjectId;
}

const AttendanceQrSchema = new Schema<IAttendanceQrDoc>(
  {
    key: { type: String, required: true, unique: true },
    secret: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

export const AttendanceQrModel = mongoose.model<IAttendanceQrDoc>(AttendanceQrKey, AttendanceQrSchema);
