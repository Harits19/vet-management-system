import http from "http";
import app from "./app";
import { serverEnv } from "./config/env";

const server = http.createServer(app);

server.listen(serverEnv.apiPort, () => {
  console.log(`Express API running on http://localhost:${serverEnv.apiPort}`);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down Express API...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
