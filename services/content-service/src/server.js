import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";

const port = Number(process.env.PORT || 4004);
const mongoUri = process.env.CONTENT_MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/luxeva-content";

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Content service listening on port ${port}`);
    });
  })
  .catch((error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Content service failed to start", error);
      process.exit(1);
    }

    process.env.CONTENT_FALLBACK_MODE = "memory";
    console.warn(`Content service running without MongoDB for local preview: ${error.message}`);
    app.listen(port, () => {
      console.log(`Content service listening on port ${port}`);
    });
  });

