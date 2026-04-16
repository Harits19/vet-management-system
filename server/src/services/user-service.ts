import bcrypt from "bcrypt";
import { User } from "../models/user-model";
import { serverEnv } from "../config/env";

class UserService {
  async ensureDefaultAdmin() {
    const existingAdmin = await User.findOne({
      email: serverEnv.seedAdminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash(serverEnv.seedAdminPassword, 10);

    return User.create({
      name: "Vet Admin",
      email: serverEnv.seedAdminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
    });
  }

  async findByEmail(email: string) {
    return User.findOne({ email: email.trim().toLowerCase() });
  }
}

export const userService = new UserService();
