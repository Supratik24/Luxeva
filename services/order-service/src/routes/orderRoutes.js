import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import {
  createOrder,
  createPaymentIntent,
  getAllOrders,
  getAnalytics,
  getCart,
  getMyOrderById,
  getMyOrders,
  syncCart,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

router.use(protect);
router.get("/cart", getCart);
router.put("/cart", syncCart);
router.post("/payments/intent", createPaymentIntent);
router.post("/", createOrder);
router.get("/mine", getMyOrders);
router.get("/mine/:id", getMyOrderById);

router.get("/admin/all", restrictTo("admin"), getAllOrders);
router.patch("/admin/:id/status", restrictTo("admin"), updateOrderStatus);
router.get("/admin/analytics/overview", restrictTo("admin"), getAnalytics);

export default router;

