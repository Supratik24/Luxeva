import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";

const port = Number(process.env.PORT || 4003);
const mongoUri = process.env.ORDER_MONGO_URI || getEnv("ORDER_MONGO_URI");

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Order service listening on port ${port}`);
    });
  })
  .catch((error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Order service failed to start", error);
      process.exit(1);
    }

    process.env.ORDER_FALLBACK_MODE = "memory";
    console.warn(`Order service running without MongoDB for local preview: ${error.message}`);
    app.listen(port, () => {
      console.log(`Order service listening on port ${port}`);
    });
  });
