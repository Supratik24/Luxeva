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

/**
 * Internal or authenticated notification creation guard
 */
const allowInternalOrCreate = (req, res, next) => {
  const internalSecret = req.headers["x-internal-service-token"];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || "luxeva_internal_service_secret";

  if (internalSecret && internalSecret === expectedSecret) {
    return next();
  }

  return protect(req, res, next);
};

router.post("/", allowInternalOrCreate, createNotification);

router.use(protect);
router.get("/mine", getMyNotifications);
router.patch("/mine/read-all", markAllAsRead);
router.patch("/mine/:id/read", markAsRead);
router.get("/admin/all", restrictTo("admin"), getAdminNotifications);

export default router;
