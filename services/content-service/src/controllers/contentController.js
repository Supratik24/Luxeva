import { ApiError, asyncHandler, sendSuccess } from "@luxeva/shared";
import Banner from "../models/Banner.js";
import ContentBlock from "../models/ContentBlock.js";

export const getHomeContent = asyncHandler(async (req, res) => {
  const [banners, testimonials, faq, pages] = await Promise.all([
    Banner.find({ active: true }).sort({ order: 1 }),
    ContentBlock.findOne({ key: "testimonials", active: true }),
    ContentBlock.findOne({ key: "faq", active: true }),
    ContentBlock.find({ key: { $in: ["about", "terms", "privacy"] }, active: true })
  ]);

  sendSuccess(res, 200, "Content fetched successfully", {
    banners,
    testimonials: testimonials?.items || [],
    faq: faq?.items || [],
    pages
  });
});

export const getPageContent = asyncHandler(async (req, res) => {
  const page = await ContentBlock.findOne({ key: req.params.slug, active: true });
  if (!page) {
    throw new ApiError(404, "Content page not found");
  }

  sendSuccess(res, 200, "Page content fetched successfully", { page });
});

export const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ order: 1 });
  sendSuccess(res, 200, "Banners fetched successfully", { banners });
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  sendSuccess(res, 201, "Banner created successfully", { banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }
  sendSuccess(res, 200, "Banner updated successfully", { banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  sendSuccess(res, 200, "Banner deleted successfully");
});

export const getBlocks = asyncHandler(async (req, res) => {
  const blocks = await ContentBlock.find().sort({ updatedAt: -1 });
  sendSuccess(res, 200, "Content blocks fetched successfully", { blocks });
});

export const upsertBlock = asyncHandler(async (req, res) => {
  const block = await ContentBlock.findOneAndUpdate(
    { key: req.body.key },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );
  sendSuccess(res, 200, "Content block saved successfully", { block });
});

