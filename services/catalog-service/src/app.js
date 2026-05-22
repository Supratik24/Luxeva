import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";
import catalogRoutes from "./routes/catalogRoutes.js";

const app = createServiceApp({ serviceName: "catalog-service", rateLimitMax: 240 });

app.use("/api/catalog", catalogRoutes);

attachErrorHandlers(app);

export default app;
