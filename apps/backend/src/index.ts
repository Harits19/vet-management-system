import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import { connectDB } from "./config/database.js";
import { seedDefaultUsers } from "./services/auth.service.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import {
  authRoutes, customerRoutes, petRoutes, productRoutes, serviceRoutes,
  dashboardRoutes, medicalHistoryRoutes, transactionRoutes,
  syncRoutes, diagnosisTemplateRoutes, letterRoutes,
} from "./routes/index.js";
import { frontendOrigins } from "./config/auth.js";

const app = express();

app.use(cors({ origin: frontendOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" })); // cukup besar utk tanda tangan digital (data URL PNG)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/medical-histories", medicalHistoryRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/diagnosis-templates", diagnosisTemplateRoutes);
app.use("/api/letters", letterRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ success: true, message: "OK" }));

// Error handler
app.use(errorHandler);

// Start
async function main() {
  await connectDB();
  await seedDefaultUsers();
  app.listen(env.PORT, () => console.log(`🚀 Server running on http://localhost:${env.PORT}`));
}
main().catch(console.error);

export default app;
