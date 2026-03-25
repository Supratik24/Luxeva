import { ApiError, asyncHandler, sendSuccess } from "@luxeva/shared";
import Address from "../models/Address.js";
import User from "../models/User.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  sendSuccess(res, 200, "Users fetched successfully", { users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const addresses = await Address.find({ user: user._id });
  sendSuccess(res, 200, "User fetched successfully", { user, addresses });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role,
      isActive: req.body.isActive
    },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  sendSuccess(res, 200, "User updated successfully", { user });
});

