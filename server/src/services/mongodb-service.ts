import mongoose from "mongoose";
import { serverEnv } from "../config/env";

mongoose.set("strictQuery", true);

class MongoDBService {
  private cachedConnection: typeof mongoose | null = null;
  private connectingPromise: Promise<typeof mongoose> | null = null;

  async connect() {
    if (this.cachedConnection) {
      return this.cachedConnection;
    }

    if (!this.connectingPromise) {
      this.connectingPromise = mongoose
        .connect(serverEnv.mongodbUri)
        .then((connection) => {
          this.cachedConnection = connection;
          console.log(`MongoDB connected: ${connection.connection.host}`);
          return connection;
        })
        .catch((error) => {
          this.connectingPromise = null;
          throw error;
        });
    }

    return this.connectingPromise;
  }
}

export const mongoDBService = new MongoDBService();
