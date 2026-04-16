import dotenv from "dotenv";
import http from "http";
import app from "./app";
import { getApiPort } from "../../src/lib/env";

dotenv.config({ path: ".env.local" });
dotenv.config();

const port = getApiPort();

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Express API running on http://localhost:${port}`);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down Express API...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
