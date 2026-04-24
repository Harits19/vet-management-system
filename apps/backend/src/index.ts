import "reflect-metadata";
import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/products.routes.js";
import { seedSuperAdmin } from "./services/auth.service.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { isAllowedOrigin } from "./config/auth.config.js";
import saleRouter from "./routes/sale.route.js";

const app = express();
const port = Number(4000);
const mongoUri = "mongodb://root:root@localhost:27017/";
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
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

app.use("/api/products", productRouter);
app.use("/api/auth", authRouter);
app.use("/api/sales", saleRouter);
app.use(errorHandler);

async function bootstrap() {
  await mongoose.connect(mongoUri);
  await seedSuperAdmin();

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
