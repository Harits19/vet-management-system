import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export const serverEnv = {
  apiPort: Number(process.env.API_PORT || 4000),
  appOrigin: process.env.NEXT_APP_ORIGIN || "http://localhost:3002",
};
