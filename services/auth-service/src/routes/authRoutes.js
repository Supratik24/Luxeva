import express from "express";
import {
  protect,
  authLimiter,
  validateAddress,
  validateProfileUpdate,
  validateRequest
} from "@luxeva/shared";
import {
  addAddress,
  deleteAddress,
  getMe,
  listAddresses,
  syncCurrentUser,
  updateAddress,
  updateProfile
} from "../controllers/authController.js";
import {
  getWallet,
  creditWallet,
  debitWallet,
  getWalletBalance
} from "../controllers/userController.js";

const router = express.Router();

// ── Internal wallet endpoints (no protect — verified by x-internal-service-token) ──
router.post("/wallet/credit", creditWallet);
router.post("/wallet/debit", debitWallet);
router.get("/wallet/balance", getWalletBalance);

router.use(protect);

// User profile & synchronization guarded by authLimiter
router.post("/sync", authLimiter, syncCurrentUser);
router.get("/me", authLimiter, getMe);
router.put("/profile", validateProfileUpdate, validateRequest, updateProfile);

// Address book management guarded by validateAddress
router.get("/addresses", listAddresses);
router.post("/addresses", validateAddress, validateRequest, addAddress);
router.put("/addresses/:id", validateAddress, validateRequest, updateAddress);
router.delete("/addresses/:id", deleteAddress);

// Wallet (authenticated customer)
router.get("/wallet", getWallet);

export default router;
