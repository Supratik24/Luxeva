import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";
import { getRedis } from "../config/redis.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};

export const protect = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const redis = getRedis();
    const isBlacklisted = await redis.get(`blacklist:${token}`);

    if (isBlacklisted) {
      return next(new ApiError(401, "Session has been revoked"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  next();
};
