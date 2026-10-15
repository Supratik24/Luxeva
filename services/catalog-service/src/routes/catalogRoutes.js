import express from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import {
  protect,
  restrictTo,
  validateRequest,
  searchLimiter,
  reviewLimiter,
  adminLimiter,
  validateCreateReview,
  validateCouponCode
} from "@luxeva/shared";
import {
  createBrand,
  createCategory,
  createCoupon,
  createProduct,
  createReview,
  createAdminReview,
  deleteBrand,
  deleteCategory,
  deleteCoupon,
  deleteMedia,
  deleteProduct,
  deleteReview,
  getBrands,
  getCatalogMeta,
  getCategories,
  getActiveCoupons,
  getCoupons,
  getLowStockProducts,
  getProductBySlug,
  getReviews,
  getSearchSuggestions,
  getWishlist,
  listMedia,
  listProducts,
  moderateReview,
  setProductRating,
  toggleWishlist,
  uploadProductImages,
  updateBrand,
  updateCategory,
  updateCoupon,
  updateProduct,
  validateCoupon
} from "../controllers/catalogController.js";

const router = express.Router();
const uploadDirectory = path.resolve("tmp", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per image
});

// Public Catalog Discovery Endpoints
router.get("/meta", getCatalogMeta);
router.get("/products", listProducts);
router.get("/products/suggestions", searchLimiter, getSearchSuggestions);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", getCategories);
router.get("/brands", getBrands);
router.get("/coupons", getActiveCoupons);
router.post("/coupons/validate", validateCouponCode, validateRequest, validateCoupon);

// Authenticated Customer Endpoints
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/toggle", protect, toggleWishlist);
router.post(
  "/products/:productId/reviews",
  protect,
  reviewLimiter,
  validateCreateReview,
  validateRequest,
  createReview
);

// Admin-Only Endpoints Guarded by protect + restrictTo("admin") + adminLimiter
router.use("/admin", protect, restrictTo("admin"), adminLimiter);
router.post("/admin/products", createProduct);
router.put("/admin/products/:id", updateProduct);
router.delete("/admin/products/:id", deleteProduct);
router.post("/admin/categories", createCategory);
router.put("/admin/categories/:id", updateCategory);
router.delete("/admin/categories/:id", deleteCategory);
router.post("/admin/brands", createBrand);
router.put("/admin/brands/:id", updateBrand);
router.delete("/admin/brands/:id", deleteBrand);
router.get("/admin/reviews", getReviews);
router.post("/admin/reviews", createAdminReview);
router.patch("/admin/reviews/:id", moderateReview);
router.delete("/admin/reviews/:id", deleteReview);
router.patch("/admin/products/:id/rating", setProductRating);
router.get("/admin/coupons", getCoupons);
router.post("/admin/coupons", createCoupon);
router.put("/admin/coupons/:id", updateCoupon);
router.delete("/admin/coupons/:id", deleteCoupon);
router.post("/admin/uploads", upload.array("images", 8), uploadProductImages);
router.get("/admin/inventory/low-stock", getLowStockProducts);
router.get("/admin/media", listMedia);
router.delete("/admin/media/:publicId", deleteMedia);

export default router;
