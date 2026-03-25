import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";
import orderRoutes from "./routes/orderRoutes.js";

const app = createServiceApp({ serviceName: "order-service", rateLimitMax: 220 });

app.use("/api/orders", orderRoutes);

attachErrorHandlers(app);

export default app;

