import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/index.js";
import env from "../config/env.js";
import type { JwtPayload } from "@vet/shared";

export async function loginUser(username: string, password: string) {
  const user = await UserModel.findOne({ username, isActive: true });
  if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const payload: JwtPayload = { userId: user._id.toString(), username: user.username, role: user.role as JwtPayload["role"] };
  const token = jwt.sign(payload as object, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as string | number } as jwt.SignOptions);

  return {
    token,
    user: { _id: user._id.toString(), name: user.name, username: user.username, role: user.role },
  };
}

export async function seedDefaultUsers() {
  if (!env.ENABLE_SEED) return;

  const existing = await UserModel.countDocuments();
  if (existing > 0) {
    console.log("ℹ️  Users already seeded, skipping.");
    return;
  }

  const password = await bcrypt.hash(env.DEFAULT_USER_PASSWORD, 10);

  const users = [
    { name: "Super Admin",  username: "superadmin", email: "super@vet.com", password, role: "superadmin" },
    { name: "Admin Toko",   username: "admin",      email: "admin@vet.com", password, role: "admin" },
    { name: "Kasir 1",      username: "kasir1",     email: "kasir1@vet.com", password, role: "cashier" },
    { name: "Kasir 2",      username: "kasir2",     email: "kasir2@vet.com", password, role: "cashier" },
    { name: "drh. Siti",    username: "dokter",      email: "dokter@vet.com", password, role: "doctor" },
  ];

  await UserModel.insertMany(users);
  console.log("✅ Default users seeded");
}
