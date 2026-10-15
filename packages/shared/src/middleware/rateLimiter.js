import rateLimit from "express-rate-limit";

const resolveClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "127.0.0.1";
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 200,
  message = "Too many requests. Please slow down and try again shortly.",
  skipHealth = true
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const clientIp = resolveClientIp(req);
      const userTag = req.user?.id ? `user_${req.user.id}` : `ip_${clientIp}`;
      return `${req.baseUrl || ""}_${userTag}`;
    },
    skip: (req) => {
      if (skipHealth && req.path === "/health") return true;
      return false;
    },
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
        : 60;

      res.setHeader("Retry-After", resetTime);
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetTime
      });
    }
  });
};

// ─── Pre-configured Tiered Production Rate Limiters ──────────────────────────

/**
 * Global API Limiter: 300 requests per 15 minutes per IP/User
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many API requests. Please try again in 15 minutes."
});

/**
 * Auth & Session Limiter: 60 requests per 15 minutes
 * Protects auth sync and profile endpoints against credential stuffing
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many authentication attempts. Please try again in a few minutes."
});

/**
 * Checkout & Payment Limiter: 30 requests per 15 minutes
 * Prevents automated order flooding and card testing attacks
 */
export const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many checkout or payment attempts. Please wait before retrying."
});

/**
 * Review Submission Limiter: 20 requests per hour
 * Prevents automated astroturfing and review spam
 */
export const reviewLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "You have submitted too many reviews recently. Please try again later."
});

/**
 * Search & Autocomplete Limiter: 180 requests per minute
 * Prevents algorithmic search scraping and memory exhaustion
 */
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  message: "Search query limit reached. Please pause a moment before searching again."
});

/**
 * Admin Operations Limiter: 600 requests per 15 minutes
 * Allows high throughput for authorized dashboard workflows
 */
export const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: "Admin operations threshold reached. Please wait before retrying."
});
