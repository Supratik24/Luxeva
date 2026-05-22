import { clerkClient, getAuth } from "@clerk/express";
import { ApiError } from "../middleware/errorHandler.js";

export const getClerkAuth = (req) => getAuth(req);

export const getClerkUser = async (req) => {
  const auth = getClerkAuth(req);
  if (!auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }

  const clerkUser = await clerkClient.users.getUser(auth.userId);
  const primaryEmailId = clerkUser.primaryEmailAddressId;
  const primaryEmail =
    clerkUser.emailAddresses.find((entry) => entry.id === primaryEmailId) ||
    clerkUser.emailAddresses[0] ||
    null;

  return {
    id: clerkUser.id,
    email: primaryEmail?.emailAddress || "",
    name:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser.username ||
      primaryEmail?.emailAddress ||
      "User",
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    imageUrl: clerkUser.imageUrl || "",
    phone:
      clerkUser.primaryPhoneNumber?.phoneNumber ||
      clerkUser.phoneNumbers?.[0]?.phoneNumber ||
      ""
  };
};
