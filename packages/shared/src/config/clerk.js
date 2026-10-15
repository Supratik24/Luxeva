import { getAuth } from "@clerk/express";
import { ApiError } from "../middleware/errorHandler.js";

const getClaimValue = (claims, keys) => {
  for (const key of keys) {
    const value = claims?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const getClerkAuth = (req) => {
  try {
    return getAuth(req);
  } catch (err) {
    return null;
  }
};

export const getClerkIdentity = (req) => {
  const auth = getClerkAuth(req);

  // In development, support mock preview tokens if Clerk keys are not set up or offline
  const authHeader = req.headers?.authorization || "";
  if (process.env.NODE_ENV !== "production" && authHeader.startsWith("Bearer preview-token-")) {
    const tokenVal = authHeader.replace("Bearer preview-token-", "").trim().toLowerCase();
    const isPreviewAdmin = tokenVal.includes("admin");
    return {
      clerkUserId: `preview_${tokenVal || "user"}`,
      sessionId: "preview_session",
      email: isPreviewAdmin
        ? (process.env.CLERK_ADMIN_EMAIL || "admin@luxeva.com").toLowerCase().trim()
        : "customer@example.com",
      firstName: isPreviewAdmin ? "Admin" : "Customer",
      lastName: "User",
      name: isPreviewAdmin ? "Admin User" : "Customer User",
      avatar: "",
      phone: "+91 9876543210",
      role: isPreviewAdmin ? "admin" : "user",
      isMock: true
    };
  }

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required. Please sign in.");
  }

  const claims = auth.sessionClaims || {};

  // Extract role from session claims (Clerk Public Metadata or custom JWT claim)
  const roleFromClaims =
    claims?.metadata?.role ||
    claims?.public_metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.role ||
    claims?.org_role ||
    "";

  const firstName = getClaimValue(claims, ["first_name", "given_name"]);
  const lastName = getClaimValue(claims, ["last_name", "family_name"]);
  const fullName =
    getClaimValue(claims, ["name", "full_name"]) ||
    [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    clerkUserId: auth.userId,
    sessionId: auth.sessionId || "",
    email: getClaimValue(claims, ["email", "email_address", "primary_email_address"]),
    firstName,
    lastName,
    name: fullName || getClaimValue(claims, ["username"]) || "User",
    avatar: getClaimValue(claims, ["image_url", "picture", "avatar"]),
    phone: getClaimValue(claims, ["phone_number", "primary_phone_number"]),
    role: String(roleFromClaims).toLowerCase().trim()
  };
};
