import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import patientsRouter from "./routes/patients.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/vet-management-system";

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok"
    }
  });
});

app.use("/api/patients", patientsRouter);

async function bootstrap() {
  await mongoose.connect(mongoUri);

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

