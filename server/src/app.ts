import express from "express";
import cors from "cors";
import User from "../../src/database/models/User";
import {
  clearAuthCookie,
  createAuthToken,
  getAuthTokenFromCookieHeader,
  serializeAuthCookie,
  verifyAuthToken,
} from "../../src/lib/auth";
import { ProductsResponse } from "@/shared/types";
import { connectMongoDB } from "./services/mongodb";

const app = express();

const allowedOrigin = process.env.NEXT_APP_ORIGIN || "http://localhost:3002";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Email dan password wajib diisi.",
      });
    }

    await connectMongoDB();

    const user = await User.findByCredentials(email.trim(), password.trim());
    const token = await createAuthToken({
      id: user._id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });

    res.setHeader("Set-Cookie", serializeAuthCookie(token));

    return res.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : "Login gagal diproses.",
    });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = getAuthTokenFromCookieHeader(req.headers.cookie);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthenticated.",
      });
    }

    const user = await verifyAuthToken(token);

    return res.json({
      success: true,
      user,
    });
  } catch (_error) {
    return res.status(401).json({
      success: false,
      error: "Session tidak valid.",
    });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.setHeader("Set-Cookie", clearAuthCookie());

  return res.json({
    success: true,
    message: "Logout berhasil.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "vet-management-system-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/products", (_req, res) => {
  const response: ProductsResponse = {
    success: true,
    message: "Express API is running alongside Next.js.",
    data: [
      {
        id: "prod-1",
        kategori: "Obat Luar",
        kode: "OBT001",
        nama: "Salep Kulit Kucing",
        stok: 15,
        pokok: 25000,
        jual: 40000,
        online: 38000,
        tampil: true,
      },
      {
        id: "prod-2",
        kategori: "Makanan",
        kode: "MKN021",
        nama: "Dry Food Adult 1kg",
        stok: 40,
        pokok: 60000,
        jual: 85000,
        online: 82000,
        tampil: true,
      },
    ],
  };
  res.json(response);
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

export default app;
