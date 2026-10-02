
import express from "express";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "payment-service",
    status: "running"
  });
});

app.use("/api/payments", paymentRoutes);

export default app;