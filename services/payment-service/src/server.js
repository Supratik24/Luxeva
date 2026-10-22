import dns from "node:dns";
import "dotenv/config";
import app from "./app.js";
import { connectDatabase, getEnv } from "@luxeva/shared";

const PORT = Number(process.env.PORT || process.env.PAYMENT_SERVICE_PORT || 4005);
const MONGO_URI =
  process.env.PAYMENT_MONGO_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/luxeva-payment";

const startServer = async () => {
  try {
    await connectDatabase(MONGO_URI);
    console.log("Payment Service connected to MongoDB.");

    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("Failed to start Payment Service:", error.message);
      process.exit(1);
    }

    process.env.PAYMENT_FALLBACK_MODE = "memory";
    console.warn(`Payment Service running without MongoDB for local preview: ${error.message}`);
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });
  }
};

startServer();
