import { getClerkIdentity } from "../config/clerk.js";
import { ApiError } from "./errorHandler.js";
import mongoose from "mongoose";

const normalizeAdminEmail = (value = "") => String(value).trim().toLowerCase();

export const protect = async (req, res, next) => {
  try {
    const clerkUser = getClerkIdentity(req);
    const adminEmail = normalizeAdminEmail(process.env.CLERK_ADMIN_EMAIL);
    const email = normalizeAdminEmail(clerkUser.email);
    
    // Fallback: Check role dynamically from auth_db
    let role = "user";
    if (adminEmail && email === adminEmail) {
      role = "admin";
    } else if (mongoose.connection.readyState === 1) {
      try {
        const authDb = mongoose.connection.useDb("auth_db", { useCache: true });
        const dbUser = await authDb.collection("users").findOne({ clerkUserId: clerkUser.clerkUserId });
        if (dbUser && dbUser.role) {
          role = dbUser.role;
        }
      } catch (err) {
        console.warn("Could not fetch user role from auth_db", err.message);
      }
    }

    req.user = {
      id: clerkUser.clerkUserId,
      clerkUserId: clerkUser.clerkUserId,
      email: clerkUser.email,
      name: clerkUser.name,
      phone: clerkUser.phone,
      avatar: clerkUser.avatar,
      role
    };

    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, "Authentication required"));
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  next();
};
