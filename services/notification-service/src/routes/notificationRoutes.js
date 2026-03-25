import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import {
  getAdminNotifications,
  getMyNotifications,
  markAsRead
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);
router.get("/mine", getMyNotifications);
router.patch("/mine/:id/read", markAsRead);
router.get("/admin/all", restrictTo("admin"), getAdminNotifications);

export default router;

