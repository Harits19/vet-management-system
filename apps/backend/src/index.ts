import "reflect-metadata";
import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/products.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { isAllowedOrigin } from "./config/auth.config.js";
import saleRouter from "./routes/sale.route.js";
import migrationService from "./services/migration.service.js";
import authService from "./services/auth.service.js";
import mongodbService from "./services/mongodb.service.js";
import saleService from "./services/sale.service.js";
import customerRouter from "./routes/customer.route.js";

const app = express();
const port = Number(4000);
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
app.use("/api/customer", customerRouter);
app.use(errorHandler);

async function bootstrap() {
  await mongodbService.connect();
  await authService.seedSuperAdmin();
  await migrationService.changeAllUserToDefaultConfig();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
