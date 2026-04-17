import { AuthUser, LoginInput } from "@/shared/types";
import { mongoDBService } from "./mongodb-service";
import { userService } from "./user-service";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { serverEnv } from "../config/env";
import { serialize } from "cookie";

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "staff";
}

class AuthService {
  encoder = new TextEncoder();

  async bootstrap() {
    await userService.ensureDefaultAdmin();
  }

  async login(input: LoginInput) {
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

    const token = await this.signAccessToken({
      sub: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
    });

    return {
      user: authUser,
      cookie: this.createAuthCookie(token),
    };
  }

  async signAccessToken(payload: SessionPayload) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.encoder.encode(serverEnv.authSecret));
  }

  async verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(
      token,
      this.encoder.encode(serverEnv.authSecret),
    );

    return payload as unknown as SessionPayload;
  }

  createAuthCookie(token: string) {
    return serialize(serverEnv.cookieName, token, {
      httpOnly: true,
      secure: serverEnv.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  clearAuthCookie() {
    return serialize(serverEnv.cookieName, "", {
      httpOnly: true,
      secure: serverEnv.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export const authService = new AuthService();
