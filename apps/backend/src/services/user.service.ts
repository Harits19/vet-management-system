import bcrypt from "bcrypt";
import { UserModel } from "../models/index.js";
import type { UserCreateRequest, UserUpdateRequest, UserFilter } from "@vet/shared";

// Output user TANPA password — dipakai semua endpoint
function sanitize(user: any) {
  return {
    _id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    doctorSignature: user.doctorSignature,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsers(filter: UserFilter) {
  const { page, limit, search, sortBy, order } = filter;
  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  const total = await UserModel.countDocuments(query);
  const data = await UserModel.find(query)
    .select("-password")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: (data as any[]).map(sanitize), total, page, limit };
}

export async function getUser(id: string) {
  const user = await UserModel.findById(id).select("-password").lean();
  if (!user) throw Object.assign(new Error("User tidak ditemukan"), { status: 404 });
  return sanitize(user);
}

export async function createUser(input: UserCreateRequest) {
  const dup = await UserModel.findOne({ $or: [{ username: input.username }, { email: input.email }] });
  if (dup) {
    throw Object.assign(
      new Error(dup.username === input.username ? "Username sudah dipakai" : "Email sudah dipakai"),
      { status: 409 }
    );
  }
  const user = await UserModel.create({ ...input, password: await bcrypt.hash(input.password, 10) });
  return sanitize(user.toObject());
}

export async function updateUser(id: string, input: UserUpdateRequest) {
  const dup = await UserModel.findOne({
    $or: [{ username: input.username }, { email: input.email }],
    _id: { $ne: id },
  });
  if (dup) {
    throw Object.assign(
      new Error(dup.username === input.username ? "Username sudah dipakai" : "Email sudah dipakai"),
      { status: 409 }
    );
  }
  const { password, ...rest } = input;
  const update: any = { ...rest };
  if (password) update.password = await bcrypt.hash(password, 10);
  const user = await UserModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!user) throw Object.assign(new Error("User tidak ditemukan"), { status: 404 });
  return sanitize(user);
}

// Soft delete — user dinonaktifkan, riwayat (transaksi/rekam medis/surat) tetap valid
export async function deleteUser(id: string) {
  const user = await UserModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  if (!user) throw Object.assign(new Error("User tidak ditemukan"), { status: 404 });
  return sanitize(user);
}
