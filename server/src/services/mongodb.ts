import mongoose from "mongoose";
import { getMongoUri } from "../../../src/lib/env";

mongoose.set("strictQuery", true);

let cachedConnection: typeof mongoose | null = null;
let connectingPromise: Promise<typeof mongoose> | null = null;

export const connectMongoDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!connectingPromise) {
    connectingPromise = mongoose.connect(getMongoUri()).then((connection) => {
      console.log(
        `connected to database - ${connection.connection.host}`,
      );
      cachedConnection = connection;
      return connection;
    });
  }

  try {
    return await connectingPromise;
  } catch (error) {
    connectingPromise = null;
    throw error;
  }
};
