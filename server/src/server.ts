import "dotenv/config";
import http from "http";
import app from "./app";

const port = Number(process.env.API_PORT || 4000);

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
