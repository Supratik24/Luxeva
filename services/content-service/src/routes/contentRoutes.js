import express from "express";
import { protect, restrictTo } from "@luxeva/shared";
import {
  createBanner,
  deleteBanner,
  getBanners,
  getBlocks,
  getHomeContent,
  getPageContent,
  updateBanner,
  upsertBlock
} from "../controllers/contentController.js";

const router = express.Router();

router.get("/home", getHomeContent);
router.get("/pages/:slug", getPageContent);

router.use("/admin", protect, restrictTo("admin"));
router.get("/admin/banners", getBanners);
router.post("/admin/banners", createBanner);
router.put("/admin/banners/:id", updateBanner);
router.delete("/admin/banners/:id", deleteBanner);
router.get("/admin/blocks", getBlocks);
router.put("/admin/blocks", upsertBlock);

export default router;

