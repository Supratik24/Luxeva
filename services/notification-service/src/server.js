import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";
import { startOrderSubscriber } from "./subscriber.js";

const port = Number(process.env.PORT || 4005);
const mongoUri = process.env.NOTIFICATION_MONGO_URI || getEnv("NOTIFICATION_MONGO_URI");

connectDatabase(mongoUri)
  .then(async () => {
    await startOrderSubscriber();
    app.listen(port, () => {
      console.log(`Notification service listening on port ${port}`);
    });
  })
  .catch(async (error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Notification service failed to start", error);
      process.exit(1);
    }

    process.env.NOTIFICATION_FALLBACK_MODE = "memory";
    console.warn(`Notification service running without MongoDB for local preview: ${error.message}`);
    try {
      await startOrderSubscriber();
    } catch (subscriberError) {
      console.warn(`Notification subscriber disabled for local preview: ${subscriberError.message}`);
    }
    app.listen(port, () => {
      console.log(`Notification service listening on port ${port}`);
    });
  });
