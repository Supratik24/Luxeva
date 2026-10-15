import { body, param, query } from "express-validator";

/**
 * Validation rules for creating a customer order
 */
export const validateCreateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a non-negative number"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be a positive integer"),
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Shipping recipient name is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("Shipping city is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("Shipping state is required"),
  body("paymentMethod")
    .optional()
    .isIn(["card", "razorpay", "cod", "netbanking", "wallet", "paylater"])
    .withMessage("Invalid payment method specified")
];

/**
 * Validation rules for submitting a product review
 */
export const validateCreateReview = [
  param("productId")
    .trim()
    .notEmpty()
    .withMessage("Product identifier is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Review title must not exceed 120 characters"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Review comment must not exceed 1500 characters")
];

/**
 * Validation rules for customer shipping / billing addresses
 */
export const validateAddress = [
  body("fullName")
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage("Full name is required (max 100 characters)"),
  body("phone")
    .trim()
    .notEmpty()
    .isLength({ min: 7, max: 16 })
    .withMessage("A valid contact phone number is required (7-16 digits)"),
  body("addressLine1")
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage("Address line 1 is required (max 200 characters)"),
  body("city")
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage("City is required"),
  body("state")
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage("State or province is required"),
  body("pinCode")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 10 })
    .withMessage("Valid postal/pin code is required")
];

/**
 * Validation rules for applying or validating promotional coupons
 */
export const validateCouponCode = [
  body("code")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 30 })
    .withMessage("Coupon code must be between 3 and 30 characters")
];

/**
 * Validation rules for customer profile updates
 */
export const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number format is invalid")
];
