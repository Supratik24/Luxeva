import { ApiError, asyncHandler, sendSuccess } from "@luxeva/shared";
import Address from "../models/Address.js";
import User from "../models/User.js";
import Wishlist from "../../../catalog-service/src/models/Wishlist.js";
import Cart from "../../../order-service/src/models/Cart.js";
import Order from "../../../order-service/src/models/Order.js";
import Notification from "../../../notification-service/src/models/Notification.js";
import Review from "../../../catalog-service/src/models/Review.js";

const normalizeAdminEmail = (value = "") => String(value).trim().toLowerCase();
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const buildUserResponse = (user) => ({
  id: user.clerkUserId || String(user._id),
  clerkUserId: user.clerkUserId || "",
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  isActive: user.isActive
});

const syncLegacyOwnership = async (legacyUserId, clerkUserId) => {
  if (!legacyUserId || String(legacyUserId) === String(clerkUserId)) {
    return;
  }

  await Promise.all([
    Address.updateMany({ user: legacyUserId }, { user: clerkUserId }),
    Wishlist.updateMany({ userId: legacyUserId }, { userId: clerkUserId }),
    Cart.updateMany({ userId: legacyUserId }, { userId: clerkUserId }),
    Order.updateMany({ userId: legacyUserId }, { userId: clerkUserId }),
    Notification.updateMany({ userId: legacyUserId }, { userId: clerkUserId }),
    Review.updateMany({ userId: legacyUserId }, { userId: clerkUserId })
  ]);
};

const ensureCurrentUser = async (req, profile = {}) => {
  const email = normalizeEmail(profile.email || req.user.email);
  if (!email) {
    throw new ApiError(400, "A Clerk email address is required");
  }

  const adminEmail = normalizeAdminEmail(process.env.CLERK_ADMIN_EMAIL);
  const role = email === adminEmail ? "admin" : "user";
  const clerkUserId = req.user.clerkUserId;
  const name = String(profile.name || req.user.name || "User").trim();
  const phone = String(profile.phone || req.user.phone || "").trim();
  const avatar = String(profile.avatar || req.user.avatar || "").trim();

  let user = await User.findOne({
    $or: [{ clerkUserId }, { email }]
  });

  const legacyUserId = user?._id ? String(user._id) : "";

  if (!user) {
    user = await User.create({
      clerkUserId,
      name,
      email,
      phone,
      avatar,
      role,
      isActive: true
    });
  } else {
    user.clerkUserId = clerkUserId;
    user.name = name || user.name;
    user.email = email;
    user.phone = phone;
    user.avatar = avatar || user.avatar;
    user.role = role;
    if (typeof user.isActive !== "boolean") {
      user.isActive = true;
    }
    await user.save();
  }

  await syncLegacyOwnership(legacyUserId, clerkUserId);

  return user;
};

export const syncCurrentUser = asyncHandler(async (req, res) => {
  const user = await ensureCurrentUser(req, req.body || {});
  const addresses = await Address.find({ user: req.user.clerkUserId }).sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, 200, "Profile synced successfully", {
    user: buildUserResponse(user),
    addresses
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await ensureCurrentUser(req);
  const addresses = await Address.find({ user: req.user.clerkUserId }).sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, 200, "Profile fetched successfully", {
    user: buildUserResponse(user),
    addresses
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await ensureCurrentUser(req, req.body || {});
  user.name = String(req.body.name || user.name || "").trim() || user.name;
  user.phone = String(req.body.phone || "").trim();
  user.avatar = String(req.body.avatar || user.avatar || "").trim();
  await user.save();

  sendSuccess(res, 200, "Profile updated successfully", { user: buildUserResponse(user) });
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user.clerkUserId }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, 200, "Addresses fetched successfully", { addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
  await ensureCurrentUser(req);

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.clerkUserId }, { isDefault: false });
  }

  const address = await Address.create({
    ...req.body,
    user: req.user.clerkUserId
  });

  if (address.isDefault) {
    await User.findOneAndUpdate({ clerkUserId: req.user.clerkUserId }, { defaultAddressId: address._id });
  }

  sendSuccess(res, 201, "Address added successfully", { address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.clerkUserId }, { isDefault: false });
  }

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user.clerkUserId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (address.isDefault) {
    await User.findOneAndUpdate({ clerkUserId: req.user.clerkUserId }, { defaultAddressId: address._id });
  }

  sendSuccess(res, 200, "Address updated successfully", { address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.clerkUserId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  sendSuccess(res, 200, "Address removed successfully");
});
