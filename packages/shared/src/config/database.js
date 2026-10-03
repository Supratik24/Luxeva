import mongoose from "mongoose";

export const connectDatabase = async (mongoUri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    family: 4, // Force IPv4 to fix Windows Atlas connection timeouts
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
};

