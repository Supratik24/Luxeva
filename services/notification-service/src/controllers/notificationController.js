import { ApiError, asyncHandler, sendSuccess } from "@luxeva/shared";
import Notification from "../models/Notification.js";

const fallbackNotifications = [];
const isNotificationFallbackMode = () => process.env.NOTIFICATION_FALLBACK_MODE === "memory";

export const createNotification = asyncHandler(async (req, res) => {
  const { userId, type, title, message, link, metadata } = req.body;
  if (!userId || !title || !message) {
    throw new ApiError(400, "userId, title, and message are required");
  }

  const notificationData = {
    userId: String(userId),
    type: type || "order_milestone",
    title: String(title),
    message: String(message),
    link: link ? String(link) : "",
    metadata: metadata || {},
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isNotificationFallbackMode()) {
    const entry = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...notificationData
    };
    fallbackNotifications.unshift(entry);
    sendSuccess(res, 201, "Notification created successfully", { notification: entry });
    return;
  }

  const notification = await Notification.create(notificationData);
  sendSuccess(res, 201, "Notification created successfully", { notification });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user?.id || req.user?._id || "");
  if (isNotificationFallbackMode()) {
    const notifications = fallbackNotifications.filter((entry) => String(entry.userId) === currentUserId);
    sendSuccess(res, 200, "Notifications fetched successfully", { notifications });
    return;
  }

  const notifications = await Notification.find({
    $or: [{ userId: currentUserId }, { userId: req.user.id }]
  }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Notifications fetched successfully", { notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user?.id || req.user?._id || "");
  if (isNotificationFallbackMode()) {
    const notification = fallbackNotifications.find(
      (entry) => entry._id === req.params.id && String(entry.userId) === currentUserId
    );
    if (notification) {
      notification.read = true;
    }
    sendSuccess(res, 200, "Notification updated successfully", { notification: notification || null });
    return;
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, $or: [{ userId: currentUserId }, { userId: req.user.id }] },
    { read: true },
    { new: true }
  );

  sendSuccess(res, 200, "Notification updated successfully", { notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user?.id || req.user?._id || "");
  if (isNotificationFallbackMode()) {
    fallbackNotifications.forEach((entry) => {
      if (String(entry.userId) === currentUserId) {
        entry.read = true;
      }
    });
    sendSuccess(res, 200, "All notifications marked as read");
    return;
  }

  await Notification.updateMany(
    { $or: [{ userId: currentUserId }, { userId: req.user.id }] },
    { read: true }
  );

  sendSuccess(res, 200, "All notifications marked as read");
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  if (isNotificationFallbackMode()) {
    sendSuccess(res, 200, "Admin notifications fetched successfully", { notifications: fallbackNotifications });
    return;
  }

  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
  sendSuccess(res, 200, "Admin notifications fetched successfully", { notifications });
});
