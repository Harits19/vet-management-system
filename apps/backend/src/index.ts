import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import patientsRouter from "./routes/products.routes.js";

const app = express();
const port = Number(4000);
const mongoUri = "mongodb://root:root@localhost:27017/";

app.use(
  cors({
    origin: "http://localhost:3002",
  }),
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api/products", patientsRouter);

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
