import { getClerkIdentity } from "../config/clerk.js";
import { ApiError } from "./errorHandler.js";

const normalizeAdminEmail = (value = "") => String(value).trim().toLowerCase();

export const protect = async (req, res, next) => {
  try {
    const clerkUser = getClerkIdentity(req);
    const adminEmail = normalizeAdminEmail(process.env.CLERK_ADMIN_EMAIL);
    const email = normalizeAdminEmail(clerkUser.email);

    req.user = {
      id: clerkUser.clerkUserId,
      clerkUserId: clerkUser.clerkUserId,
      email: clerkUser.email,
      name: clerkUser.name,
      phone: clerkUser.phone,
      avatar: clerkUser.avatar,
      role: adminEmail && email === adminEmail ? "admin" : "user"
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
