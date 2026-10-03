
import dns from "node:dns";


import "dotenv/config";
import app from "./app.js";
import { connectDatabase, getEnv } from "@luxeva/shared";

const PORT = Number(getEnv("PAYMENT_SERVICE_PORT", 4005));
const MONGO_URI = getEnv("MONGO_URI");

const startServer = async () => {
  try {
    await connectDatabase(MONGO_URI);
    console.log("Payment Service connected to MongoDB.");

    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Payment Service:", error.message);
    process.exit(1);
  }
};

startServer();
