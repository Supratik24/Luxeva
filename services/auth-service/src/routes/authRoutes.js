import express from "express";
import { body } from "express-validator";
import { protect, validateRequest } from "@luxeva/shared";
import {
  addAddress,
  adminLogin,
  changePassword,
  deleteAddress,
  forgotPassword,
  getMe,
  listAddresses,
  login,
  logout,
  resetPassword,
  resetPasswordWithOtp,
  signup,
  updateAddress,
  updateProfile,
  verifyResetOtp
} from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
  ],
  validateRequest,
  signup
);
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  login
);
router.post(
  "/admin/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  adminLogin
);
router.post(
  "/forgot-password",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("channel")
      .optional()
      .isIn(["sms", "email"])
      .withMessage("Reset channel must be either sms or email")
  ],
  validateRequest,
  forgotPassword
);
router.post(
  "/verify-reset-otp",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("otp").isLength({ min: 4, max: 8 }).withMessage("Please enter a valid OTP")
  ],
  validateRequest,
  verifyResetOtp
);
router.post(
  "/reset-password-otp",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail({ gmail_remove_dots: false }),
    body("otp").isLength({ min: 4, max: 8 }).withMessage("Please enter a valid OTP"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
      .withMessage("Password must include uppercase, lowercase, number, and special character")
  ],
  validateRequest,
  resetPasswordWithOtp
);
router.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
      .withMessage("Password must include uppercase, lowercase, number, and special character")
  ],
  validateRequest,
  resetPassword
);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.get("/addresses", protect, listAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);

export default router;
