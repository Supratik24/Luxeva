import rateLimit from "express-rate-limit";

export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 120) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again in a moment."
    }
  });

