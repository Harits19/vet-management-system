import type { PipelineStage } from "mongoose";
import QRCode from "qrcode";
import { UserModel, AttendanceModel } from "../models/index.js";
import env from "../config/env.js";

export const FACE_DIM = 128;
export const QR_PREFIX = "VET-ABSEN:";

export type AttendanceMode = "face" | "qr" | "both";
export type AttendanceMethod = "face" | "qr";

export interface AttendanceConfig {
  mode: AttendanceMode;
  faceEnabled: boolean;
  qrEnabled: boolean;
  locationEnabled: boolean;
  officeLat: number | null;
  officeLng: number | null;
  radiusMeters: number;
  faceThreshold: number;
}

export interface CheckInInput {
  method?: string;
  type?: string;
  descriptor?: unknown;
  qrSecret?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  livenessPassed?: boolean;
}

function normalizeMode(value: string | undefined): AttendanceMode {
  // default: qr (keputusan user — QR code jadi metode absen utama)
  return value === "face" || value === "qr" || value === "both" ? value : "qr";
}

export function attendanceConfig(): AttendanceConfig {
  const mode = normalizeMode(env.ATTENDANCE_MODE);
  const lat = Number(env.OFFICE_LAT);
  const lng = Number(env.OFFICE_LNG);
  const locationEnabled =
    Boolean(env.OFFICE_LAT && env.OFFICE_LNG) && Number.isFinite(lat) && Number.isFinite(lng);
  return {
    mode,
    faceEnabled: mode !== "qr",
    qrEnabled: mode !== "face",
    locationEnabled,
    officeLat: locationEnabled ? lat : null,
    officeLng: locationEnabled ? lng : null,
    radiusMeters: env.OFFICE_RADIUS_METERS,
    faceThreshold: env.ATTENDANCE_FACE_THRESHOLD,
  };
}

/** Tanggal lokal Indonesia (UTC+7) — container server ber-TZ UTC, absen harus ikut hari WIB. */
export function localDateString(d: Date): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Isi QR statis — dipajang di tempat absen, di-scan karyawan untuk absen. */
export function qrContent(): string {
  return `${QR_PREFIX}${env.ATTENDANCE_QR_SECRET}`;
}

export async function generateQrPng(): Promise<Buffer> {
  return QRCode.toBuffer(qrContent(), { type: "png", width: 512, margin: 2, errorCorrectionLevel: "M" });
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function euclideanDistance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

function validDescriptor(d: unknown): d is number[] {
  return Array.isArray(d) && d.length === FACE_DIM && d.every((n) => typeof n === "number" && Number.isFinite(n));
}

function verifyLocation(inputLat: unknown, inputLng: unknown, inputAccuracy: unknown) {
  const cfg = attendanceConfig();
  if (!cfg.locationEnabled) return null;
  const lat = Number(inputLat);
  const lng = Number(inputLng);
  const accuracy = Number.isFinite(Number(inputAccuracy)) ? Number(inputAccuracy) : null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw Object.assign(new Error("Lokasi tidak terdeteksi. Aktifkan GPS dan coba lagi"), { status: 400 });
  }
  const distance = haversineMeters(lat, lng, cfg.officeLat as number, cfg.officeLng as number);
  if (distance > cfg.radiusMeters) {
    throw Object.assign(
      new Error(
        `Di luar area kantor (jarak ${Math.round(distance)} m dari titik kantor, maks ${cfg.radiusMeters} m)`
      ),
      { status: 400 }
    );
  }
  return { lat, lng, accuracy, distance };
}

export async function getStatus(userId: string) {
  const user = await UserModel.findById(userId).select("faceDescriptor faceRegisteredAt").lean();
  const today = localDateString(new Date());
  const records = await AttendanceModel.find({ userId, date: today }).sort({ timestamp: 1 }).lean();
  const todayIn = records.find((r) => r.type === "in");
  const todayOut = records.find((r) => r.type === "out");
  return {
    hasFace: Boolean(user?.faceDescriptor?.length),
    faceRegisteredAt: user?.faceRegisteredAt ?? null,
    today,
    todayIn: todayIn ? { type: todayIn.type, method: todayIn.method, timestamp: todayIn.timestamp } : null,
    todayOut: todayOut ? { type: todayOut.type, method: todayOut.method, timestamp: todayOut.timestamp } : null,
  };
}

export async function registerFace(userId: string, descriptor: unknown) {
  if (!attendanceConfig().faceEnabled) {
    throw Object.assign(new Error("Metode wajah sedang nonaktif (ATTENDANCE_MODE)"), { status: 400 });
  }
  if (!validDescriptor(descriptor)) {
    throw Object.assign(new Error("Descriptor wajah tidak valid (harus 128 angka)"), { status: 400 });
  }
  await UserModel.findByIdAndUpdate(
    userId,
    { $set: { faceDescriptor: descriptor, faceRegisteredAt: new Date() } },
    { new: true, runValidators: true }
  );
  return { message: "Wajah berhasil didaftarkan" };
}

export async function checkIn(userId: string, role: string, input: CheckInInput) {
  if (role === "superadmin") {
    throw Object.assign(new Error("Superadmin tidak perlu absen"), { status: 403 });
  }

  const cfg = attendanceConfig();
  const method: AttendanceMethod = input.method === "qr" ? "qr" : "face";
  if (method === "face" && !cfg.faceEnabled) {
    throw Object.assign(new Error("Metode absen wajah sedang nonaktif"), { status: 400 });
  }
  if (method === "qr" && !cfg.qrEnabled) {
    throw Object.assign(new Error("Metode absen QR sedang nonaktif"), { status: 400 });
  }

  const type: "in" | "out" = input.type === "out" ? "out" : "in";

  const user = await UserModel.findById(userId).select("faceDescriptor").lean();

  let faceDistance: number | null = null;
  let livenessPassed = false;
  if (method === "face") {
    if (!user?.faceDescriptor?.length) {
      throw Object.assign(new Error("Wajah belum terdaftar. Daftarkan wajah terlebih dahulu"), { status: 400 });
    }
    const descriptor = input.descriptor;
    if (!validDescriptor(descriptor)) {
      throw Object.assign(new Error("Descriptor wajah tidak valid"), { status: 400 });
    }
    faceDistance = euclideanDistance(descriptor, user.faceDescriptor);
    if (faceDistance > cfg.faceThreshold) {
      throw Object.assign(new Error("Wajah tidak cocok dengan wajah terdaftar"), { status: 400 });
    }
    if (input.livenessPassed !== true) {
      throw Object.assign(new Error("Verifikasi liveness gagal. Silakan coba lagi"), { status: 400 });
    }
    livenessPassed = true;
  } else {
    // QR statis: secret dari QR + posisi GPS device (lokasi dicek kalau OFFICE_LAT/LNG terisi)
    if (typeof input.qrSecret !== "string" || input.qrSecret !== qrContent()) {
      throw Object.assign(new Error("QR tidak valid untuk tempat ini"), { status: 400 });
    }
  }

  const location = verifyLocation(input.lat, input.lng, input.accuracy);

  const now = new Date();
  const today = localDateString(now);

  const existingIn = await AttendanceModel.findOne({ userId, date: today, type: "in" }).lean();
  const existingOut = await AttendanceModel.findOne({ userId, date: today, type: "out" }).lean();
  if (type === "in" && existingIn) {
    throw Object.assign(new Error("Sudah absen masuk hari ini"), { status: 400 });
  }
  if (type === "out" && !existingIn) {
    throw Object.assign(new Error("Belum absen masuk hari ini"), { status: 400 });
  }
  if (type === "out" && existingOut) {
    throw Object.assign(new Error("Sudah absen pulang hari ini"), { status: 400 });
  }

  const record = await AttendanceModel.create({
    userId,
    method,
    type,
    timestamp: now,
    date: today,
    location: location ? { lat: location.lat, lng: location.lng, accuracy: location.accuracy } : undefined,
    faceDistance,
    livenessPassed,
  });

  return {
    message: type === "in" ? "Absen masuk berhasil" : "Absen pulang berhasil",
    data: record.toObject(),
  };
}

export async function listMine(userId: string, date?: string) {
  const filter: { userId: string; date?: string } = { userId };
  if (date) filter.date = date;
  return AttendanceModel.find(filter).sort({ timestamp: -1 }).limit(50).lean();
}

export async function listAll(date?: string) {
  const match: Record<string, string> = {};
  if (date) match.date = date;

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { timestamp: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "u",
      },
    },
    { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        method: 1,
        type: 1,
        timestamp: 1,
        date: 1,
        location: 1,
        faceDistance: 1,
        livenessPassed: 1,
        userName: "$u.name",
        userRole: "$u.role",
      },
    },
  ];

  return AttendanceModel.aggregate(pipeline);
}
