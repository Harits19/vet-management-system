import { configDotenv } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

// Always read the root .env — for development AND production (no .env.example).
// npm workspace scripts run with cwd = the workspace folder (apps/backend), so
// resolve the file from the repo root.
const repoRoot = path.resolve(import.meta.dirname, "../../../../");
const envPath = path.join(repoRoot, ".env");
if (!existsSync(envPath)) {
  console.warn(`⚠️  ${envPath} tidak ditemukan. Copy template dulu: cp .env.example .env`);
}
configDotenv({ path: envPath });

const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vet-management",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  DEFAULT_USER_PASSWORD: process.env.DEFAULT_USER_PASSWORD || "password123",
  ENABLE_SEED: process.env.ENABLE_SEED === "true",
};

export default env;
