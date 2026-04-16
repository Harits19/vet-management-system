import express from "express";
import cors from "cors";

const app = express();

const allowedOrigin = process.env.NEXT_APP_ORIGIN || "http://localhost:3002";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "vet-management-system-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/products", (_req, res) => {
  res.json({
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
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

export default app;
