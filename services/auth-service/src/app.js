import express from "express";
import { attachErrorHandlers, createServiceApp } from "@luxeva/shared";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = createServiceApp({ serviceName: "auth-service", rateLimitMax: 180 });

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("src/uploads"));

attachErrorHandlers(app);

export default app;

