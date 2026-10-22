import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { sanitizeInput } from "../middleware/sanitize.js";
import { errorHandler, notFound } from "../middleware/errorHandler.js";

export const createServiceApp = ({ serviceName, rateLimitMax = 300, parseBody = true }) => {
  const app = express();
  app.set("trust proxy", 1);

  // Production-grade security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      xFrameOptions: { action: "deny" }
    })
  );

  // Clerk authentication context
  app.use(clerkMiddleware());

  // CORS Policy with development flexibility and production origin validation
  const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const allowedOrigins = [
    ...configuredOrigins,
    "https://luxeva-frontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173"
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow internal proxy, curl, and server-to-server requests without Origin header
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV !== "production") return callback(null, true);
        const normalized = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(normalized) || normalized.endsWith(".vercel.app")) {
          return callback(null, true);
        }
        return callback(new Error("CORS policy violation: origin not permitted"), false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
    })
  );

  if (parseBody) {
    // 1MB body limit prevents memory exhaustion denial-of-service
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  }

  // Automatic input sanitization against NoSQL operator injection and XSS
  app.use(sanitizeInput);

  app.use(morgan("dev"));
  app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: rateLimitMax }));

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      service: serviceName,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  return app;
};

export const attachErrorHandlers = (app) => {
  app.use(notFound);
  app.use(errorHandler);
};
