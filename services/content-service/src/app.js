import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";
import contentRoutes from "./routes/contentRoutes.js";

const app = createServiceApp({ serviceName: "content-service", rateLimitMax: 180 });

app.use("/api/content", contentRoutes);

attachErrorHandlers(app);

export default app;

