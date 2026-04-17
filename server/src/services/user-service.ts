import bcrypt from "bcrypt";
import { serverEnv } from "../config/env";
import { UserDB } from "@/shared/types";

class UserService {
  async ensureDefaultAdmin() {
    const existingAdmin = await UserDB.findOne({
      email: serverEnv.seedAdminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash(serverEnv.seedAdminPassword, 10);

    return UserDB.create({
      name: "Vet Admin",
      email: serverEnv.seedAdminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
    });
  }

  async findByEmail(email: string) {
    return UserDB.findOne({ email: email.trim().toLowerCase() });
  }
}

export const userService = new UserService();
