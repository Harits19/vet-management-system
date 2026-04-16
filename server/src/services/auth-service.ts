import { AuthUser, LoginInput } from "@/shared/types";
import { createAuthCookie, signAccessToken } from "../lib/auth";
import { mongoDBService } from "./mongodb-service";
import { userService } from "./user-service";

class AuthService {
  async bootstrap() {
    await mongoDBService.connect();
    await userService.ensureDefaultAdmin();
  }

  async login(input: LoginInput) {
    await mongoDBService.connect();

    const user = await userService.findByEmail(input.email);

    if (!user) {
      throw new Error("Email atau password salah.");
    }

    const isPasswordValid = await user.verifyPassword(input.password);

    if (!isPasswordValid) {
      throw new Error("Email atau password salah.");
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = await signAccessToken({
      sub: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
    });

    return {
      user: authUser,
      cookie: createAuthCookie(token),
    };
  }
}

export const authService = new AuthService();
