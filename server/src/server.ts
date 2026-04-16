import http from "http";
import app from "./app";
import { serverEnv } from "./config/env";
import { authService } from "./services/auth-service";

async function bootstrap() {
  if (!serverEnv.mongodbUri) {
    throw new Error("MONGODB_URI atau LOCAL_URL wajib diisi.");
  }

  await authService.bootstrap();

  const server = http.createServer(app);

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${serverEnv.apiPort} sedang dipakai proses lain.`);
      process.exit(1);
    }

    console.error("HTTP server error", error);
    process.exit(1);
  });

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
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
