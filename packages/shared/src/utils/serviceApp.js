import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { errorHandler, notFound } from "../middleware/errorHandler.js";

export const createServiceApp = ({ serviceName, rateLimitMax = 200, parseBody = true }) => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "*",
      credentials: true
    })
  );
  if (parseBody) {
    app.use(express.json({ limit: "2mb" }));
    app.use(express.urlencoded({ extended: true }));
  }
  app.use(morgan("dev"));
  app.use(createRateLimiter(15 * 60 * 1000, rateLimitMax));

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      service: serviceName,
      uptime: process.uptime()
    });
  });

  return app;
};

export const attachErrorHandlers = (app) => {
  app.use(notFound);
  app.use(errorHandler);
};
