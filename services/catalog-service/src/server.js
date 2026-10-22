import dns from "node:dns";


import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";

const port = Number(process.env.PORT || 4002);
const mongoUri = process.env.CATALOG_MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/luxeva-catalog";

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Catalog service listening on port ${port}`);
    });
  })
  .catch((error) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Catalog service failed to start", error);
      process.exit(1);
    }

    process.env.CATALOG_FALLBACK_MODE = "memory";
    console.warn(`Catalog service running without MongoDB for local preview: ${error.message}`);
    app.listen(port, () => {
      console.log(`Catalog service listening on port ${port}`);
    });
  });

