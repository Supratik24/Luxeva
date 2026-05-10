import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import {
  createOrder,
  createPaymentIntent,
  createRazorpayOrder,
  getAllOrders,
  getAnalytics,
  getCart,
  getMyOrderById,
  getMyOrders,
  syncCart,
  verifyRazorpayPayment,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();
const allowPreviewPaymentAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (process.env.NODE_ENV !== "production" && authHeader.startsWith("Bearer preview-token-")) {
    return next();
  }

  return protect(req, res, next);
};

router.post("/payments/razorpay/order", allowPreviewPaymentAuth, createRazorpayOrder);
router.post("/payments/razorpay/verify", allowPreviewPaymentAuth, verifyRazorpayPayment);

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
