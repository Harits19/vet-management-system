import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import { connectDB } from "./config/database.js";
import { seedDefaultUsers } from "./services/auth.service.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import {
  authRoutes,
  customerRoutes,
  petRoutes,
  productRoutes,
  saleRoutes,
  dashboardRoutes,
} from "./routes/index.js";
import { frontendOrigins } from "./config/auth.js";

const app = express();

// Middleware
app.use(cors({ origin: frontendOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

// Error handler
app.use(errorHandler);

// Start
async function main() {
  await connectDB();
  await seedDefaultUsers();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  });
}

main().catch(console.error);

export default app;
