import {
  ApiError,
  asyncHandler,
  buildCacheKey,
  getPagination,
  getRedis,
  sendSuccess
} from "@luxeva/shared";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Wishlist from "../models/Wishlist.js";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const invalidateCatalogCache = async () => {
  const redis = getRedis();
  const keys = await redis.keys("catalog:*");
  if (keys.length) {
    await redis.del(keys);
  }
};

const syncProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const payload = stats[0] || { averageRating: 0, reviewCount: 0 };
  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(payload.averageRating?.toFixed?.(1) || 0),
    reviewCount: payload.reviewCount
  });
};

const buildProductQuery = (query) => {
  const filter = {};

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.color) filter.colors = query.color;
  if (query.size) filter.sizes = query.size;
  if (query.availability === "in-stock") filter.stock = { $gt: 0 };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { tags: { $regex: query.search, $options: "i" } },
      { sku: { $regex: query.search, $options: "i" } }
    ];
  }
  if (query.rating) {
    filter.averageRating = { $gte: Number(query.rating) };
  }
  if (query.featured) filter.featured = query.featured === "true";
  if (query.trending) filter.trending = query.trending === "true";

  return filter;
};

const buildSort = (sort = "newest") => {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "best-selling":
      return { soldCount: -1 };
    case "top-rated":
      return { averageRating: -1 };
    case "popular":
      return { reviewCount: -1, soldCount: -1 };
    default:
      return { createdAt: -1 };
  }
};

export const getCatalogMeta = asyncHandler(async (req, res) => {
  const [categories, brands, featuredProducts] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Brand.find().sort({ name: 1 }),
    Product.find({ featured: true }).limit(8).sort({ createdAt: -1 })
  ]);

  sendSuccess(res, 200, "Catalog metadata fetched", {
    categories,
    brands,
    featuredProducts
  });
});

export const listProducts = asyncHandler(async (req, res) => {
  const cacheKey = buildCacheKey("catalog:products", req.query);
  const redis = getRedis();
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = buildProductQuery(req.query);
  const sort = buildSort(req.query.sort);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category brand")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  const payload = {
    success: true,
    message: "Products fetched successfully",
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  await redis.set(cacheKey, JSON.stringify(payload), "EX", 60);
  res.json(payload);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `catalog:product:${req.params.slug}`;
  const redis = getRedis();
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const product = await Product.findOne({ slug: req.params.slug }).populate("category brand");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const [reviews, relatedProducts] = await Promise.all([
    Review.find({ product: product._id, status: "approved" }).sort({ createdAt: -1 }).limit(10),
    Product.find({
      _id: { $ne: product._id },
      $or: [{ category: product.category._id }, { brand: product.brand._id }]
    })
      .limit(4)
      .sort({ soldCount: -1 })
  ]);

  const payload = {
    success: true,
    message: "Product fetched successfully",
    product,
    reviews,
    relatedProducts
  };

  await redis.set(cacheKey, JSON.stringify(payload), "EX", 120);
  res.json(payload);
});

export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return sendSuccess(res, 200, "Suggestions fetched", { suggestions: [] });
  }

  const cacheKey = `catalog:suggest:${q}`;
  const redis = getRedis();
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const suggestions = await Product.find({ name: { $regex: q, $options: "i" } })
    .select("name slug price images")
    .limit(6);

  const payload = {
    success: true,
    message: "Suggestions fetched",
    suggestions
  };

  await redis.set(cacheKey, JSON.stringify(payload), "EX", 90);
  res.json(payload);
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    slug: slugify(req.body.name)
  };

  const product = await Product.create(payload);
  await invalidateCatalogCache();
  sendSuccess(res, 201, "Product created successfully", { product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.name) {
    payload.slug = slugify(payload.name);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await invalidateCatalogCache();
  sendSuccess(res, 200, "Product updated successfully", { product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await invalidateCatalogCache();
  sendSuccess(res, 200, "Product deleted successfully");
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  sendSuccess(res, 200, "Categories fetched successfully", { categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    ...req.body,
    slug: slugify(req.body.name)
  });
  await invalidateCatalogCache();
  sendSuccess(res, 201, "Category created successfully", { category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      slug: req.body.name ? slugify(req.body.name) : undefined
    },
    { new: true, runValidators: true }
  );
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  await invalidateCatalogCache();
  sendSuccess(res, 200, "Category updated successfully", { category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  await invalidateCatalogCache();
  sendSuccess(res, 200, "Category deleted successfully");
});

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  sendSuccess(res, 200, "Brands fetched successfully", { brands });
});

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create({
    ...req.body,
    slug: slugify(req.body.name)
  });
  await invalidateCatalogCache();
  sendSuccess(res, 201, "Brand created successfully", { brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      slug: req.body.name ? slugify(req.body.name) : undefined
    },
    { new: true, runValidators: true }
  );

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  await invalidateCatalogCache();
  sendSuccess(res, 200, "Brand updated successfully", { brand });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  await invalidateCatalogCache();
  sendSuccess(res, 200, "Brand deleted successfully");
});

export const createReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const review = await Review.create({
    product: req.params.productId,
    userId: req.user.id,
    userName: req.user.name,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment
  });

  await syncProductRating(product._id);
  await invalidateCatalogCache();

  sendSuccess(res, 201, "Review submitted successfully", { review });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await syncProductRating(review.product);
  await invalidateCatalogCache();

  sendSuccess(res, 200, "Review updated successfully", { review });
});

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate("product", "name slug").sort({ createdAt: -1 });
  sendSuccess(res, 200, "Reviews fetched successfully", { reviews });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: String(req.body.code || "").toUpperCase() });
  if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date())) {
    throw new ApiError(404, "Coupon is invalid or expired");
  }

  sendSuccess(res, 200, "Coupon applied successfully", { coupon });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, "Coupons fetched successfully", { coupons });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    code: String(req.body.code || "").toUpperCase()
  });
  sendSuccess(res, 201, "Coupon created successfully", { coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      code: req.body.code ? String(req.body.code).toUpperCase() : undefined
    },
    { new: true, runValidators: true }
  );
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  sendSuccess(res, 200, "Coupon updated successfully", { coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  sendSuccess(res, 200, "Coupon deleted successfully");
});

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate("products");
  sendSuccess(res, 200, "Wishlist fetched successfully", {
    wishlist: wishlist || { userId: req.user.id, products: [] }
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const wishlist = (await Wishlist.findOne({ userId: req.user.id })) || (await Wishlist.create({ userId: req.user.id, products: [] }));
  const productId = req.body.productId;
  const exists = wishlist.products.some((entry) => String(entry) === String(productId));

  wishlist.products = exists
    ? wishlist.products.filter((entry) => String(entry) !== String(productId))
    : [...wishlist.products, productId];

  await wishlist.save();
  await wishlist.populate("products");

  sendSuccess(res, 200, exists ? "Removed from wishlist" : "Added to wishlist", { wishlist });
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const files = (req.files || []).map((file) => ({
    url: `/uploads/${file.filename}`,
    alt: file.originalname
  }));

  sendSuccess(res, 201, "Images uploaded successfully", { files });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ stock: { $lte: 10 } })
    .select("name slug stock sku")
    .sort({ stock: 1 })
    .limit(12);

  sendSuccess(res, 200, "Low stock products fetched successfully", { products });
});
