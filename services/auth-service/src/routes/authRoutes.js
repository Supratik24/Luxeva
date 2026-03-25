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
  signup,
  updateAddress,
  updateProfile
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
      .normalizeEmail({ gmail_remove_dots: false })
  ],
  validateRequest,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  [body("password").isLength({ min: 6 })],
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
