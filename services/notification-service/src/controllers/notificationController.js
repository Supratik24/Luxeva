import { asyncHandler, sendSuccess } from "@luxeva/shared";
import Notification from "../models/Notification.js";

const fallbackNotifications = [];
const isNotificationFallbackMode = () => process.env.NOTIFICATION_FALLBACK_MODE === "memory";

export const getMyNotifications = asyncHandler(async (req, res) => {
  if (isNotificationFallbackMode()) {
    const notifications = fallbackNotifications.filter((entry) => entry.userId === req.user.id);
    sendSuccess(res, 200, "Notifications fetched successfully", { notifications });
    return;
  }

  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Notifications fetched successfully", { notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  if (isNotificationFallbackMode()) {
    const notification = fallbackNotifications.find(
      (entry) => entry._id === req.params.id && entry.userId === req.user.id
    );
    if (notification) {
      notification.read = true;
    }
    sendSuccess(res, 200, "Notification updated successfully", { notification: notification || null });
    return;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );

  sendSuccess(res, 200, "Notification updated successfully", { notification });
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  if (isNotificationFallbackMode()) {
    sendSuccess(res, 200, "Admin notifications fetched successfully", { notifications: fallbackNotifications });
    return;
  }

  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
  sendSuccess(res, 200, "Admin notifications fetched successfully", { notifications });
});
