import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import {
  createNotification,
  getAdminNotifications,
  getMyNotifications,
  markAllAsRead,
  markAsRead
} from "../controllers/notificationController.js";

const router = express.Router();

// Allow internal service or clients to create milestone notifications
router.post("/", createNotification);

router.use(protect);
router.get("/mine", getMyNotifications);
router.patch("/mine/read-all", markAllAsRead);
router.patch("/mine/:id/read", markAsRead);
router.get("/admin/all", restrictTo("admin"), getAdminNotifications);

export default router;


