import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";

const port = Number(process.env.PORT || 4002);
const mongoUri = process.env.CATALOG_MONGO_URI || getEnv("CATALOG_MONGO_URI");

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Catalog service listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Catalog service failed to start", error);
    process.exit(1);
  });
