import "reflect-metadata";

import http, { Server } from "http";
import app from "./app";
import { serverEnv } from "./config/env";
import { authService } from "./services/auth-service";
import { mongoDBService } from "./services/mongodb-service";

class ServerApp {
  private server?: Server;

  public async start() {
    try {
      this.validateEnv();
      await this.initializeServices();
      this.createServer();
      this.handleErrors();
      this.listen();
      this.handleShutdown();
    } catch (error) {
      console.error("❌ Failed to start server", error);
      process.exit(1);
    }
  }

  private validateEnv() {
    if (!serverEnv.mongodbUri) {
      throw new Error("MONGODB_URI atau LOCAL_URL wajib diisi.");
    }
  }

  private async initializeServices() {
    await mongoDBService.connect();
    await authService.bootstrap();
  }

  private createServer() {
    this.server = http.createServer(app);
  }

  private handleErrors() {
    this.server?.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${serverEnv.apiPort} sedang dipakai proses lain.`,
        );
        process.exit(1);
      }

      console.error("❌ HTTP server error", error);
      process.exit(1);
    });
  }

  private listen() {
    this.server?.listen(serverEnv.apiPort, () => {
      console.log(
        `🚀 Express API running on http://localhost:${serverEnv.apiPort}`,
      );
    });
  }

  private handleShutdown() {
    const shutdown = (signal: string) => {
      console.log(`⚠️ Received ${signal}. Shutting down Express API...`);

      this.server?.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }
}

// run server
const serverApp = new ServerApp();
serverApp.start();
