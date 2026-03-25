import express from "express";
import multer from "multer";
import { body } from "express-validator";
import { protect, restrictTo, validateRequest } from "@luxeva/shared";
import {
  createBrand,
  createCategory,
  createCoupon,
  createProduct,
  createReview,
  deleteBrand,
  deleteCategory,
  deleteCoupon,
  deleteProduct,
  getBrands,
  getCatalogMeta,
  getCategories,
  getCoupons,
  getLowStockProducts,
  getProductBySlug,
  getReviews,
  getSearchSuggestions,
  getWishlist,
  listProducts,
  moderateReview,
  toggleWishlist,
  uploadProductImages,
  updateBrand,
  updateCategory,
  updateCoupon,
  updateProduct,
  validateCoupon
} from "../controllers/catalogController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  }
});
const upload = multer({ storage });

router.get("/meta", getCatalogMeta);
router.get("/products", listProducts);
router.get("/products/suggestions", getSearchSuggestions);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", getCategories);
router.get("/brands", getBrands);
router.post("/coupons/validate", validateCoupon);

router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/toggle", protect, toggleWishlist);
router.post(
  "/products/:productId/reviews",
  protect,
  [body("rating").isInt({ min: 1, max: 5 })],
  validateRequest,
  createReview
);

router.use("/admin", protect, restrictTo("admin"));
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
router.patch("/admin/reviews/:id", moderateReview);
router.get("/admin/coupons", getCoupons);
router.post("/admin/coupons", createCoupon);
router.put("/admin/coupons/:id", updateCoupon);
router.delete("/admin/coupons/:id", deleteCoupon);
router.post("/admin/uploads", upload.array("images", 8), uploadProductImages);
router.get("/admin/inventory/low-stock", getLowStockProducts);

export default router;
