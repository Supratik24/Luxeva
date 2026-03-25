import { connectDatabase, getEnv } from "@luxeva/shared";
import app from "./app.js";

const port = Number(process.env.PORT || 4004);
const mongoUri = process.env.CONTENT_MONGO_URI || getEnv("CONTENT_MONGO_URI");

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Content service listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Content service failed to start", error);
    process.exit(1);
  });
