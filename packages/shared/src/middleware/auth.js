import { getClerkIdentity } from "../config/clerk.js";
import { clerkClient } from "@clerk/express";
import { ApiError } from "./errorHandler.js";
import mongoose from "mongoose";

const normalizeAdminEmail = (value = "") => String(value).trim().toLowerCase();
const clerkUserCache = new Map();

export const protect = async (req, res, next) => {
  try {
    const clerkUser = getClerkIdentity(req);
    const adminEmail = normalizeAdminEmail(process.env.CLERK_ADMIN_EMAIL);
    let email = normalizeAdminEmail(clerkUser.email);
    
    // If email is not in the JWT session claims, query Clerk API
    if (!email && clerkUser.clerkUserId) {
      const cached = clerkUserCache.get(clerkUser.clerkUserId);
      if (cached && Date.now() - cached.cachedAt < 300000) {
        email = cached.email;
        if (!clerkUser.name && cached.name) clerkUser.name = cached.name;
        clerkUser.email = email;
      } else {
        try {
          const clerkData = await clerkClient.users.getUser(clerkUser.clerkUserId);
          const resolvedEmail =
            clerkData?.primaryEmailAddress?.emailAddress ||
            clerkData?.emailAddresses?.[0]?.emailAddress ||
            "";
          email = normalizeAdminEmail(resolvedEmail);
          clerkUser.email = email;
          const resolvedName =
            [clerkData?.firstName, clerkData?.lastName].filter(Boolean).join(" ").trim() ||
            clerkData?.username ||
            clerkUser.name;
          clerkUser.name = resolvedName;
          clerkUserCache.set(clerkUser.clerkUserId, {
            email,
            name: resolvedName,
            cachedAt: Date.now()
          });
        } catch (err) {
          console.warn("Could not fetch user details from Clerk API:", err.message);
        }
      }
    }

    // Role resolution: Admin email match or auth_db lookup
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
