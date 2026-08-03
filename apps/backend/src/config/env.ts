import { configDotenv } from "dotenv";
import path from "node:path";

// Resolve env files from the repo root. npm workspace scripts run with cwd =
// the workspace folder (apps/backend), so a relative ".env" path would silently
// miss the root env file. Dev reads .env.example, production reads .env.
const repoRoot = path.resolve(import.meta.dirname, "../../..");
configDotenv({
  path: path.join(repoRoot, process.env.NODE_ENV !== "production" ? ".env.example" : ".env"),
});

const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vet-management",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  DEFAULT_USER_PASSWORD: process.env.DEFAULT_USER_PASSWORD || "password123",
  ENABLE_SEED: process.env.ENABLE_SEED === "true",
};

export default env;
