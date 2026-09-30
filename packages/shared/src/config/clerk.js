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

export const getClerkAuth = (req) => getAuth(req);

export const getClerkIdentity = (req) => {
  const auth = getClerkAuth(req);

  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const claims = auth.sessionClaims || {};
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
    phone: getClaimValue(claims, ["phone_number", "primary_phone_number"])
  };
};
