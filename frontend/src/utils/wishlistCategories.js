import {
  Shirt,
  Cpu,
  Footprints,
  Sparkles,
  Home,
  ShoppingBag,
  Watch,
  Package
} from "lucide-react";

/**
 * Canonical category bucket definitions.
 * Categorizes diverse products into clean, recognizable customer collections
 * (e.g., Clothing, Electronics, Footwear, etc.) while preserving specific subcategories.
 */
export const CATEGORY_BUCKETS = {
  clothing: {
    id: "clothing",
    name: "Clothing & Apparel",
    shortName: "Clothing",
    description: "Kurtas, shirts, jackets, dresses, and wardrobe essentials",
    icon: Shirt,
    keywords: [
      "women-ethnic",
      "men-fashion",
      "clothing",
      "apparel",
      "fashion",
      "ethnic",
      "kurta",
      "shirt",
      "dress",
      "saree",
      "jacket",
      "suit",
      "t-shirt",
      "jeans",
      "pants",
      "trousers",
      "anarkali"
    ]
  },
  electronics: {
    id: "electronics",
    name: "Electronics & Gadgets",
    shortName: "Electronics",
    description: "Smart audio, chargers, personal tech, and everyday gadgets",
    icon: Cpu,
    keywords: [
      "electronics",
      "gadget",
      "audio",
      "headphones",
      "earbuds",
      "smart-watch",
      "charger",
      "tech",
      "cable",
      "speaker",
      "powerbank"
    ]
  },
  footwear: {
    id: "footwear",
    name: "Footwear & Shoes",
    shortName: "Footwear",
    description: "Daily sandals, sneakers, loafers, and work shoes",
    icon: Footprints,
    keywords: [
      "footwear",
      "shoes",
      "sandals",
      "sneakers",
      "loafers",
      "boots",
      "heels",
      "slippers",
      "chappals"
    ]
  },
  beauty: {
    id: "beauty",
    name: "Beauty & Wellness",
    shortName: "Beauty",
    description: "Skincare, grooming, fragrance, and self-care essentials",
    icon: Sparkles,
    keywords: [
      "beauty-wellness",
      "beauty",
      "wellness",
      "skincare",
      "grooming",
      "fragrance",
      "makeup",
      "cosmetics",
      "serum"
    ]
  },
  home: {
    id: "home",
    name: "Home & Living",
    shortName: "Home & Living",
    description: "Cookware, tableware, appliances, and home decor accents",
    icon: Home,
    keywords: [
      "home-kitchen",
      "home-decor",
      "appliances",
      "kitchen",
      "cookware",
      "decor",
      "bedding",
      "furniture",
      "living"
    ]
  },
  bags: {
    id: "bags",
    name: "Bags & Luggage",
    shortName: "Bags & Luggage",
    description: "Office backpacks, totes, duffels, and travel carry",
    icon: ShoppingBag,
    keywords: [
      "bags-luggage",
      "bags",
      "luggage",
      "backpack",
      "tote",
      "duffel",
      "travel",
      "wallet"
    ]
  },
  accessories: {
    id: "accessories",
    name: "Watches & Accessories",
    shortName: "Accessories",
    description: "Timepieces, jewelry, eyewear, and finishing pieces",
    icon: Watch,
    keywords: [
      "watches-accessories",
      "watches",
      "watch",
      "accessories",
      "jewelry",
      "sunglasses",
      "eyewear",
      "belt"
    ]
  }
};

/**
 * Resolves any product to a canonical wishlist category bucket.
 * Gracefully inspects category slug, category name, tags, and product name.
 */
export const resolveProductCategory = (product) => {
  if (!product) {
    return {
      id: "other",
      name: "Other Items",
      shortName: "Other",
      icon: Package,
      originalName: "Other"
    };
  }

  // Extract raw category string/slug
  const rawCatSlug = (
    product.category?.slug ||
    (typeof product.category === "string" ? product.category : "") ||
    ""
  ).toLowerCase();

  const rawCatName = (
    product.category?.name ||
    (typeof product.category === "string" ? product.category : "") ||
    ""
  ).trim();

  const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];
  const productName = (product.name || "").toLowerCase();

  // Test against canonical buckets
  for (const [bucketId, bucket] of Object.entries(CATEGORY_BUCKETS)) {
    // 1. Direct slug/name match
    if (
      rawCatSlug &&
      bucket.keywords.some((kw) => rawCatSlug.includes(kw) || kw.includes(rawCatSlug))
    ) {
      return {
        ...bucket,
        originalName: rawCatName || bucket.name
      };
    }

    // 2. Category name match
    if (
      rawCatName &&
      bucket.keywords.some((kw) => rawCatName.toLowerCase().includes(kw))
    ) {
      return {
        ...bucket,
        originalName: rawCatName
      };
    }

    // 3. Tags match
    if (tags.some((tag) => bucket.keywords.some((kw) => tag.includes(kw)))) {
      return {
        ...bucket,
        originalName: rawCatName || bucket.name
      };
    }

    // 4. Product title match (fallback)
    if (bucket.keywords.some((kw) => productName.includes(kw))) {
      return {
        ...bucket,
        originalName: rawCatName || bucket.name
      };
    }
  }

  // Fallback for custom category created by admin
  if (rawCatName) {
    return {
      id: rawCatSlug || rawCatName.toLowerCase().replace(/\s+/g, "-"),
      name: rawCatName,
      shortName: rawCatName,
      description: `Curated products in ${rawCatName}`,
      icon: Package,
      originalName: rawCatName
    };
  }

  return {
    id: "other",
    name: "Other Essentials",
    shortName: "Other",
    description: "Curated lifestyle pieces and essentials",
    icon: Package,
    originalName: "Other"
  };
};

/**
 * Groups an array of wishlist products by their resolved category.
 * Returns an array of category groups with products and metadata.
 */
export const groupWishlistByCategory = (products = []) => {
  const groupsMap = new Map();

  products.forEach((product) => {
    const categoryInfo = resolveProductCategory(product);
    const groupId = categoryInfo.id;

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        category: categoryInfo,
        products: [],
        subCategories: new Set(),
        totalValue: 0
      });
    }

    const group = groupsMap.get(groupId);
    group.products.push(product);
    if (categoryInfo.originalName) {
      group.subCategories.add(categoryInfo.originalName);
    }
    group.totalValue += Number(product.price || 0);
  });

  // Convert map to sorted array (groups with most items first)
  return Array.from(groupsMap.values()).map((g) => ({
    ...g,
    subCategories: Array.from(g.subCategories)
  }));
};
