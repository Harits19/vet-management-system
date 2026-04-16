import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export const serverEnv = {
  authSecret: process.env.AUTH_SECRET || "local-auth-secret",
  apiPort: Number(process.env.API_PORT || 4000),
  appOrigin: process.env.NEXT_APP_ORIGIN || "http://localhost:3002",
  cookieName: "vet_session",
  isProduction: process.env.NODE_ENV === "production",
  mongodbUri: process.env.MONGODB_URI || process.env.LOCAL_URL || "",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || "admin@vet.local",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "admin123",
};
