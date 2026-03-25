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
  .catch((error) => {
    console.error("Notification service failed to start", error);
    process.exit(1);
  });
