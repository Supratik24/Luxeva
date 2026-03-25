import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = createServiceApp({ serviceName: "notification-service", rateLimitMax: 180 });

app.use("/api/notifications", notificationRoutes);

attachErrorHandlers(app);

export default app;

