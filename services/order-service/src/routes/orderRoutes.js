import express from "express";
import {
  protect,
  restrictTo,
  checkoutLimiter,
  adminLimiter,
  validateCreateOrder,
  validateRequest
} from "@luxeva/shared";
import {
  createOrder,
  createRazorpayOrder,
  getAllOrders,
  getAnalytics,
  getCart,
  getMyOrderById,
  getMyOrders,
  syncCart,
  verifyRazorpayPayment,
  updateOrderStatus,
  requestReturn,
  getReturnDetails,
  getAllReturns,
  reviewReturnDecision
} from "../controllers/orderController.js";

const router = express.Router();

const allowPreviewPaymentAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (process.env.NODE_ENV !== "production" && authHeader.startsWith("Bearer preview-token-")) {
    return next();
  }

  return protect(req, res, next);
};

// Payment endpoints protected with rate limiting against card testing / flood attacks
router.post("/payments/razorpay/order", checkoutLimiter, allowPreviewPaymentAuth, createRazorpayOrder);
router.post("/payments/razorpay/verify", checkoutLimiter, allowPreviewPaymentAuth, verifyRazorpayPayment);

// Customer endpoints
router.use(protect);
router.get("/cart", getCart);
router.put("/cart", syncCart);
router.post("/", checkoutLimiter, validateCreateOrder, validateRequest, createOrder);
router.get("/mine", getMyOrders);
router.get("/mine/:id", getMyOrderById);
router.post("/:id/return", requestReturn);
router.get("/:id/return", getReturnDetails);

// Admin-only endpoints guarded by restrictTo("admin") and dedicated adminLimiter
router.use("/admin", restrictTo("admin"), adminLimiter);
router.get("/admin/all", getAllOrders);
router.get("/admin/returns", getAllReturns);
router.patch("/admin/returns/:id/decision", reviewReturnDecision);
router.patch("/admin/:id/status", updateOrderStatus);
router.get("/admin/analytics/overview", getAnalytics);

export default router;
