import { asyncHandler, sendSuccess } from "@luxeva/shared";
import Notification from "../models/Notification.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Notifications fetched successfully", { notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );

  sendSuccess(res, 200, "Notification updated successfully", { notification });
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
  sendSuccess(res, 200, "Admin notifications fetched successfully", { notifications });
});

