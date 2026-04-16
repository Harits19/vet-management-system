import mongoose from "mongoose";
import { getMongoUri } from "@/lib/env";
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(getMongoUri());

    console.log(`connected to database - ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error : ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
