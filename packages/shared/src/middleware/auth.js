import { getClerkIdentity } from "../config/clerk.js";
import { clerkClient } from "@clerk/express";
import { ApiError } from "./errorHandler.js";
import mongoose from "mongoose";

const normalizeAdminEmail = (value = "") => String(value).trim().toLowerCase();
const clerkUserCache = new Map();

/**
 * Authentication Middleware: Verifies the Clerk JWT token and attaches
 * an immutable req.user object with validated role and identity.
 */
export const protect = async (req, res, next) => {
  try {
    const clerkUser = getClerkIdentity(req);
    const adminEmail = normalizeAdminEmail(process.env.CLERK_ADMIN_EMAIL);
    let email = normalizeAdminEmail(clerkUser.email);

    // If email is not in the JWT session claims, query Clerk API (cached for 5 min)
    if (!email && clerkUser.clerkUserId && !clerkUser.isMock) {
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
          console.warn("[Auth] Could not fetch user details from Clerk API:", err.message);
        }
      }
    }

    // Role resolution hierarchy:
    // 1. Clerk session claim metadata (publicMetadata.role === "admin")
    // 2. Configured admin email match (CLERK_ADMIN_EMAIL)
    // 3. Verified database role (auth_db.users.role)
    // 4. Default: "user"
    let role = "user";
    if (clerkUser.role === "admin") {
      role = "admin";
    } else if (adminEmail && email === adminEmail) {
      role = "admin";
    } else if (mongoose.connection?.readyState === 1 && clerkUser.clerkUserId) {
      try {
        const authDb = mongoose.connection.useDb("auth_db", { useCache: true });
        const dbUser = await authDb.collection("users").findOne({ clerkUserId: clerkUser.clerkUserId });
        if (dbUser && dbUser.role) {
          role = dbUser.role;
        }
      } catch (err) {
        console.warn("[Auth] Could not query role from auth_db:", err.message);
      }
    }

    // Build immutable req.user object
    req.user = Object.freeze({
      id: clerkUser.clerkUserId,
      clerkUserId: clerkUser.clerkUserId,
      email: clerkUser.email || email,
      name: clerkUser.name,
      phone: clerkUser.phone,
      avatar: clerkUser.avatar,
      role,
      isMock: Boolean(clerkUser.isMock)
    });

    // Security Defense: Strip any rogue 'role' property sent in request body
    // to strictly prevent privilege escalation attacks
    if (req.body && typeof req.body === "object" && "role" in req.body && role !== "admin") {
      delete req.body.role;
    }

    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, error.message || "Authentication required"));
  }
};

/**
 * Role-Based Access Control (RBAC) Guard Middleware
 * Restricts route access to specific roles (e.g. 'admin', 'manager')
 */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const userRole = req.user?.role || "anonymous";
    console.warn(
      `[RBAC Security Alert] Unauthorized access attempt: User "${req.user?.id || "N/A"}" (role: "${userRole}") tried accessing "${req.originalUrl || req.baseUrl}"`
    );
    return next(new ApiError(403, "You do not have permission to access this resource."));
  }

  next();
};

/**
 * IDOR / Resource Ownership Guard Middleware
 * Ensures regular users can only read or manipulate their own resources.
 * Admins are automatically granted access.
 */
export const requireOwnership = (extractOwnerId) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  // Admins bypass ownership checks
  if (req.user.role === "admin") {
    return next();
  }

  const ownerId = typeof extractOwnerId === "function" ? extractOwnerId(req) : req.params.userId || req.params.id;
  if (!ownerId || String(ownerId) !== String(req.user.id)) {
    return next(new ApiError(403, "Forbidden: You are not authorized to access another user's resource."));
  }

  next();
};
