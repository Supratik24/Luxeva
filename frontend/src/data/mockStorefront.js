const imageBank = {
  womenEthnic: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  menFashion: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  electronics: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  homeKitchen: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80",
  bags: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
  watches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  decor: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  appliances: "https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=1200&q=80"
};

export const useLocalPreviewData = true;

export const mockCategories = [
  { _id: "cat-1", name: "Women Ethnic", slug: "women-ethnic", description: "Kurtas, sarees, and festive silhouettes.", image: imageBank.womenEthnic, featured: true },
  { _id: "cat-2", name: "Men Fashion", slug: "men-fashion", description: "Modern fits for workdays and weekends.", image: imageBank.menFashion, featured: true },
  { _id: "cat-3", name: "Footwear", slug: "footwear", description: "Comfort-led daily shoes and sandals.", image: imageBank.footwear, featured: true },
  { _id: "cat-4", name: "Electronics", slug: "electronics", description: "Smart gadgets and audio picks.", image: imageBank.electronics, featured: true },
  { _id: "cat-5", name: "Beauty & Wellness", slug: "beauty-wellness", description: "Skincare and everyday grooming.", image: imageBank.beauty, featured: true },
  { _id: "cat-6", name: "Home & Kitchen", slug: "home-kitchen", description: "Useful upgrades for Indian homes.", image: imageBank.homeKitchen, featured: true },
  { _id: "cat-7", name: "Bags & Luggage", slug: "bags-luggage", description: "Carry picks for work and travel.", image: imageBank.bags, featured: true },
  { _id: "cat-8", name: "Watches & Accessories", slug: "watches-accessories", description: "Finishing pieces with everyday appeal.", image: imageBank.watches, featured: true },
  { _id: "cat-9", name: "Home Decor", slug: "home-decor", description: "Warm accents for polished interiors.", image: imageBank.decor, featured: true },
  { _id: "cat-10", name: "Appliances", slug: "appliances", description: "Small appliances for fast daily use.", image: imageBank.appliances, featured: true }
];

export const mockBrands = [
  { _id: "brand-1", name: "IndiWeave", slug: "indiweave", featured: true },
  { _id: "brand-2", name: "Metro Mile", slug: "metro-mile", featured: true },
  { _id: "brand-3", name: "StrideCraft", slug: "stridecraft", featured: true },
  { _id: "brand-4", name: "Signal One", slug: "signal-one", featured: true },
  { _id: "brand-5", name: "GlowNest", slug: "glownest", featured: true },
  { _id: "brand-6", name: "HomeMitra", slug: "homemitra", featured: true },
  { _id: "brand-7", name: "CarryCraft", slug: "carrycraft", featured: true },
  { _id: "brand-8", name: "HourMark", slug: "hourmark", featured: true },
  { _id: "brand-9", name: "RoomStory", slug: "roomstory", featured: true },
  { _id: "brand-10", name: "SwiftServe", slug: "swiftserve", featured: true }
];

const productGroups = [
  {
    categorySlug: "women-ethnic",
    brandSlug: "indiweave",
    images: [
      "/products/cotton-printed-kurta-set.png",
      "/products/festive-anarkali-kurta.png",
      "/products/chikankari-straight-kurta.png",
      "/products/organza-saree-with-border.png",
      "/products/printed-co-ord-suit.png"
    ],
    colors: ["Blue", "Pink", "Mustard"],
    sizes: ["S", "M", "L", "XL"],
    items: [
      ["Cotton Printed Kurta Set", "cotton-printed-kurta-set", 1899, 2499, true, true],
      ["Festive Anarkali Kurta", "festive-anarkali-kurta", 2799, 3499, true, false],
      ["Chikankari Straight Kurta", "chikankari-straight-kurta", 2199, 2899, false, true],
      ["Organza Saree with Border", "organza-saree-with-border", 3299, 4199, false, false],
      ["Printed Co-ord Suit", "printed-co-ord-suit", 2499, 3199, false, true]
    ]
  },
  {
    categorySlug: "men-fashion",
    brandSlug: "metro-mile",
    images: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80",
      "/products/everyday-polo-tshirt.png",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80",
      "/products/festive-nehru-jacket.png",
      "/products/cotton-pathani-kurta.png"
    ],
    colors: ["Black", "Navy", "Olive"],
    sizes: ["M", "L", "XL", "XXL"],
    items: [
      ["Linen Blend Casual Shirt", "linen-blend-casual-shirt", 1499, 1999, true, false],
      ["Everyday Polo T-Shirt", "everyday-polo-tshirt", 999, 1399, false, true],
      ["Tapered Fit Jeans", "tapered-fit-jeans", 1799, 2299, false, false],
      ["Festive Nehru Jacket", "festive-nehru-jacket", 2599, 3299, true, false],
      ["Cotton Pathani Kurta", "cotton-pathani-kurta", 1999, 2499, false, false]
    ]
  },
  {
    categorySlug: "footwear",
    brandSlug: "stridecraft",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "/products/city-loafers.png",
      "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: ["Black", "Grey"],
    sizes: ["6", "7", "8", "9", "10"],
    items: [
      ["Air Cushion Running Sneakers", "air-cushion-running-sneakers", 2399, 3199, true, true],
      ["City Loafers", "city-loafers", 1999, 2699, false, false],
      ["Comfort Strap Sandals", "comfort-strap-sandals", 1299, 1699, false, false],
      ["Formal Lace-Up Shoes", "formal-lace-up-shoes", 2899, 3699, false, false],
      ["Weekend Slides", "weekend-slides", 899, 1199, false, true]
    ]
  },
  {
    categorySlug: "electronics",
    brandSlug: "signal-one",
    images: [
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80",
      "/products/portable-bluetooth-speaker.png",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: ["Black", "White"],
    sizes: ["Standard"],
    items: [
      ["True Wireless Earbuds", "true-wireless-earbuds", 1799, 2499, true, true],
      ["AMOLED Smart Watch", "amoled-smart-watch", 3499, 4999, true, false],
      ["Portable Bluetooth Speaker", "portable-bluetooth-speaker", 2299, 2999, false, false],
      ["65W Fast Wall Charger", "65w-fast-wall-charger", 1499, 1999, false, true],
      ["Flex Neckband Earphones", "flex-neckband-earphones", 1299, 1699, false, false]
    ]
  },
  {
    categorySlug: "beauty-wellness",
    brandSlug: "glownest",
    images: [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
      "/products/spf-50-daily-sunscreen.png",
      "/products/argan-hair-serum.png",
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: ["Standard"],
    sizes: ["Standard"],
    items: [
      ["Vitamin C Face Wash", "vitamin-c-face-wash", 349, 449, false, true],
      ["SPF 50 Daily Sunscreen", "spf-50-daily-sunscreen", 499, 649, true, false],
      ["Argan Hair Serum", "argan-hair-serum", 549, 699, false, false],
      ["Longwear Lip Tint Duo", "longwear-lip-tint-duo", 699, 899, false, false],
      ["Beard Grooming Kit", "beard-grooming-kit", 899, 1199, false, false]
    ]
  },
  {
    categorySlug: "home-kitchen",
    brandSlug: "homemitra",
    images: [
      "/products/nonstick-cookware-set.png",
      "/products/stainless-steel-pressure-cooker.png",
      "/products/glass-storage-canister-set.png",
      "/products/stoneware-dinner-plate-set.png",
      "/products/chef-knife-trio.png"
    ],
    colors: ["Standard"],
    sizes: ["Standard"],
    items: [
      ["Nonstick Cookware Set", "nonstick-cookware-set", 3499, 4499, true, false],
      ["Stainless Steel Pressure Cooker", "stainless-steel-pressure-cooker", 2299, 2899, false, false],
      ["Glass Storage Canister Set", "glass-storage-canister-set", 999, 1399, false, false],
      ["Stoneware Dinner Plate Set", "stoneware-dinner-plate-set", 1699, 2199, false, false],
      ["Chef Knife Trio", "chef-knife-trio", 1299, 1699, false, false]
    ]
  },
  {
    categorySlug: "bags-luggage",
    brandSlug: "carrycraft",
    images: [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=80",
      "/products/travel-duffel-bag.png",
      "/products/laptop-tote-bag.png"
    ],
    colors: ["Black", "Grey"],
    sizes: ["Standard"],
    items: [
      ["Urban Office Backpack", "urban-office-backpack", 1999, 2599, true, false],
      ["Cabin Trolley Bag", "cabin-trolley-bag", 4299, 5499, false, true],
      ["Crossbody Sling Bag", "crossbody-sling-bag", 1299, 1699, false, false],
      ["Travel Duffel Bag", "travel-duffel-bag", 1899, 2399, false, false],
      ["Laptop Tote Bag", "laptop-tote-bag", 2199, 2899, false, false]
    ]
  },
  {
    categorySlug: "watches-accessories",
    brandSlug: "hourmark",
    images: [
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80"
    ],
    colors: ["Black", "Brown"],
    sizes: ["Standard"],
    items: [
      ["Classic Analog Watch", "classic-analog-watch", 2499, 3199, true, false],
      ["Metal Strap Dress Watch", "metal-strap-dress-watch", 2999, 3899, false, false],
      ["Leather Wallet", "leather-wallet", 899, 1299, false, true],
      ["UV Shield Sunglasses", "uv-shield-sunglasses", 1199, 1599, false, false],
      ["Minimal Bracelet Set", "minimal-bracelet-set", 699, 999, false, false]
    ]
  },
  {
    categorySlug: "home-decor",
    brandSlug: "roomstory",
    images: [
      "/products/textured-table-lamp.png",
      "https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1200&q=80",
      "/products/accent-wall-mirror.png",
      "/products/ceramic-planter-pair.png",
      "/products/soft-throw-blanket.png"
    ],
    colors: ["Beige", "Taupe"],
    sizes: ["Standard"],
    items: [
      ["Textured Table Lamp", "textured-table-lamp", 2499, 3199, true, false],
      ["Embroidered Cushion Cover Set", "embroidered-cushion-cover-set", 999, 1399, false, false],
      ["Accent Wall Mirror", "accent-wall-mirror", 3199, 4099, false, false],
      ["Ceramic Planter Pair", "ceramic-planter-pair", 1299, 1699, false, false],
      ["Soft Throw Blanket", "soft-throw-blanket", 1499, 1999, false, false]
    ]
  },
  {
    categorySlug: "appliances",
    brandSlug: "swiftserve",
    images: [
      "/products/750w-mixer-grinder.png",
      "/products/induction-cooktop.png",
      "/products/electric-kettle.png",
      "/products/digital-air-fryer.png",
      "/products/steam-iron.png"
    ],
    colors: ["Black", "Silver"],
    sizes: ["Standard"],
    items: [
      ["750W Mixer Grinder", "750w-mixer-grinder", 3499, 4499, true, false],
      ["Induction Cooktop", "induction-cooktop", 2599, 3299, false, false],
      ["Electric Kettle", "electric-kettle", 1499, 1999, false, true],
      ["Digital Air Fryer", "digital-air-fryer", 5499, 6999, false, false],
      ["Steam Iron", "steam-iron", 1899, 2499, false, false]
    ]
  }
];

const categoryMap = Object.fromEntries(mockCategories.map((category) => [category.slug, category]));
const brandMap = Object.fromEntries(mockBrands.map((brand) => [brand.slug, brand]));
const productOverrides = {
  "cotton-printed-kurta-set": {
    colors: ["Blue"],
    variantImages: { Blue: "/products/cotton-printed-kurta-set.png" }
  },
  "festive-anarkali-kurta": {
    colors: ["Pink"],
    variantImages: { Pink: "/products/festive-anarkali-kurta.png" }
  },
  "chikankari-straight-kurta": {
    colors: ["Blue"],
    variantImages: { Blue: "/products/chikankari-straight-kurta.png" }
  },
  "organza-saree-with-border": {
    colors: ["Magenta"],
    variantImages: { Magenta: "/products/organza-saree-with-border.png" }
  },
  "printed-co-ord-suit": {
    colors: ["Ivory"],
    variantImages: { Ivory: "/products/printed-co-ord-suit.png" }
  },
  "everyday-polo-tshirt": {
    colors: ["Olive"],
    variantImages: { Olive: "/products/everyday-polo-tshirt.png" }
  },
  "festive-nehru-jacket": {
    colors: ["Ivory"],
    variantImages: { Ivory: "/products/festive-nehru-jacket.png" }
  },
  "cotton-pathani-kurta": {
    colors: ["Blue"],
    variantImages: { Blue: "/products/cotton-pathani-kurta.png" }
  },
  "city-loafers": {
    colors: ["Brown"],
    variantImages: { Brown: "/products/city-loafers.png" }
  },
  "portable-bluetooth-speaker": {
    colors: ["Black"],
    variantImages: { Black: "/products/portable-bluetooth-speaker.png" }
  },
  "spf-50-daily-sunscreen": {
    colors: ["White"],
    variantImages: { White: "/products/spf-50-daily-sunscreen.png" }
  },
  "argan-hair-serum": {
    colors: ["Amber"],
    variantImages: { Amber: "/products/argan-hair-serum.png" }
  },
  "nonstick-cookware-set": {
    colors: ["Red"],
    variantImages: { Red: "/products/nonstick-cookware-set.png" }
  },
  "stainless-steel-pressure-cooker": {
    colors: ["Silver"],
    variantImages: { Silver: "/products/stainless-steel-pressure-cooker.png" }
  },
  "glass-storage-canister-set": {
    colors: ["Cream"],
    variantImages: { Cream: "/products/glass-storage-canister-set.png" }
  },
  "stoneware-dinner-plate-set": {
    colors: ["Teal"],
    variantImages: { Teal: "/products/stoneware-dinner-plate-set.png" }
  },
  "chef-knife-trio": {
    colors: ["Black"],
    variantImages: { Black: "/products/chef-knife-trio.png" }
  },
  "travel-duffel-bag": {
    colors: ["Brown"],
    variantImages: { Brown: "/products/travel-duffel-bag.png" }
  },
  "laptop-tote-bag": {
    colors: ["Black"],
    variantImages: { Black: "/products/laptop-tote-bag.png" }
  },
  "textured-table-lamp": {
    colors: ["Amber"],
    variantImages: { Amber: "/products/textured-table-lamp.png" }
  },
  "accent-wall-mirror": {
    colors: ["Walnut"],
    variantImages: { Walnut: "/products/accent-wall-mirror.png" }
  },
  "ceramic-planter-pair": {
    colors: ["Verdigris"],
    variantImages: { Verdigris: "/products/ceramic-planter-pair.png" }
  },
  "soft-throw-blanket": {
    colors: ["Mint"],
    variantImages: { Mint: "/products/soft-throw-blanket.png" }
  },
  "750w-mixer-grinder": {
    colors: ["Blue"],
    variantImages: { Blue: "/products/750w-mixer-grinder.png" }
  },
  "induction-cooktop": {
    colors: ["Black"],
    variantImages: { Black: "/products/induction-cooktop.png" }
  },
  "electric-kettle": {
    colors: ["Silver"],
    variantImages: { Silver: "/products/electric-kettle.png" }
  },
  "digital-air-fryer": {
    colors: ["Black"],
    variantImages: { Black: "/products/digital-air-fryer.png" }
  },
  "steam-iron": {
    colors: ["Blue"],
    variantImages: { Blue: "/products/steam-iron.png" }
  }
};

export const mockProducts = productGroups.flatMap((group, groupIndex) =>
  group.items.map(([name, slug, price, compareAtPrice, featured, trending], itemIndex) => {
    const override = productOverrides[slug] || {};
    const fallbackImage = group.images[itemIndex] || categoryMap[group.categorySlug]?.image || imageBank.womenEthnic;

    return {
      _id: `product-${groupIndex + 1}-${itemIndex + 1}`,
      name,
      slug,
      shortDescription: `${name} curated for Indian shopping with practical everyday value and polished presentation.`,
      description: `${name} is part of the local preview collection, chosen to feel relevant for Indian shoppers across fashion, essentials, and home categories.`,
      category: categoryMap[group.categorySlug],
      brand: brandMap[group.brandSlug],
      images: [{ url: fallbackImage, alt: name }],
      variantImages: override.variantImages || {},
      price,
      compareAtPrice,
      discountPercent: Math.round(((compareAtPrice - price) / compareAtPrice) * 100),
      sku: `MOCK-${groupIndex + 1}${itemIndex + 1}`,
      stock: 12 + itemIndex * 4,
      soldCount: 30 + groupIndex * 11 + itemIndex * 7,
      featured,
      trending,
      tags: [group.categorySlug, group.brandSlug, "india-preview"],
      colors: override.colors || group.colors,
      sizes: group.sizes,
      averageRating: Number((4.2 + ((groupIndex + itemIndex) % 5) * 0.15).toFixed(1)),
      reviewCount: 18 + groupIndex * 3 + itemIndex,
      specs: {
        material: "Preview assortment",
        fit: "Everyday use",
        warranty: "Brand warranty",
        care: "See label",
        origin: "India"
      }
    };
  })
);

export const mockCoupons = [
  {
    code: "WELCOME10",
    label: "10% off on orders above Rs. 1,999",
    highlight: "Save up to Rs. 600",
    theme: "bg-[#f5ede2] text-[#5c3b1e] dark:bg-[#2a2017] dark:text-[#f2dcc0]",
    type: "percentage",
    value: 10,
    minOrderAmount: 1999,
    maxDiscount: 600
  },
  {
    code: "STYLE20",
    label: "20% off on fashion carts above Rs. 3,999",
    highlight: "Best on apparel edits",
    theme: "bg-[#e7f1ea] text-[#1f5a37] dark:bg-[#14251a] dark:text-[#b5e4c7]",
    type: "percentage",
    value: 20,
    minOrderAmount: 3999,
    maxDiscount: 1200
  },
  {
    code: "HOME500",
    label: "Flat Rs. 500 off on orders above Rs. 4,999",
    highlight: "Ideal for home upgrades",
    theme: "bg-[#e7eef9] text-[#24446c] dark:bg-[#152033] dark:text-[#bfd6ff]",
    type: "flat",
    value: 500,
    minOrderAmount: 4999
  },
  {
    code: "MEGA1000",
    label: "Flat Rs. 1,000 off on orders above Rs. 9,999",
    highlight: "Big cart bonus",
    theme: "bg-[#f8e8ef] text-[#7b2e4b] dark:bg-[#2d1821] dark:text-[#ffc7da]",
    type: "flat",
    value: 1000,
    minOrderAmount: 9999
  }
];

export const mockContent = {
  banners: [
    {
      _id: "banner-1",
      title: "Shopping that feels made for India",
      subtitle: "Fashion, gadgets, and home picks you actually want",
      description: "Browse a broader catalogue with local pricing in rupees, India-friendly categories, and a cleaner premium storefront.",
      image: imageBank.womenEthnic,
      ctaLabel: "Shop the new arrivals",
      ctaLink: "/shop",
      theme: "sand"
    }
  ],
  testimonials: [
    { name: "Riya Mehta", role: "Frequent shopper", quote: "The mix of ethnic wear, gadgets, and home picks feels much closer to how I actually shop online." },
    { name: "Arjun Nair", role: "Working professional", quote: "The rupee pricing and cleaner catalogue instantly made the storefront feel more local and usable." },
    { name: "Neha Sharma", role: "Home stylist", quote: "The product cards look sharper now and the decor section finally feels complete." }
  ],
  faq: [
    { question: "How long does shipping take?", answer: "Domestic orders usually arrive in 3 to 5 business days depending on your location." },
    { question: "Can I update my order after checkout?", answer: "You can contact support quickly after placing the order and we will help if fulfillment has not started." },
    { question: "How are admin routes secured?", answer: "Admin pages are protected in the frontend and every admin API route is enforced with backend role-based authorization." }
  ],
  pages: {
    about: {
      title: "Built for premium, modern commerce",
      subtitle: "Luxeva pairs a refined shopping interface with a scalable microservices backend, secure authentication, Redis-backed performance, and an admin experience designed for real operations."
    },
    terms: {
      title: "Terms & Conditions",
      items: [
        { heading: "Orders", content: "Orders are subject to availability, verification, and payment confirmation." },
        { heading: "Accounts", content: "Users are responsible for safeguarding account credentials and activity." }
      ]
    },
    privacy: {
      title: "Privacy Policy",
      items: [
        { heading: "Data usage", content: "We use account and order data to deliver the service, support requests, and improve the product." },
        { heading: "Security", content: "Authentication relies on hashed passwords, JWTs, and protected service routes." }
      ]
    }
  }
};

export const getMockMeta = () => ({
  categories: mockCategories,
  brands: mockBrands,
  featuredProducts: mockProducts.filter((product) => product.featured).slice(0, 8)
});

export const getMockProducts = (filters = {}) => {
  let products = [...mockProducts];

  if (filters.category) products = products.filter((product) => product.category?._id === filters.category);
  if (filters.brand) products = products.filter((product) => product.brand?._id === filters.brand);
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    products = products.filter((product) => product.name.toLowerCase().includes(q) || product.tags.some((tag) => tag.includes(q)));
  }
  if (filters.minPrice) products = products.filter((product) => product.price >= Number(filters.minPrice));
  if (filters.maxPrice) products = products.filter((product) => product.price <= Number(filters.maxPrice));
  if (filters.rating) products = products.filter((product) => product.averageRating >= Number(filters.rating));
  if (filters.availability === "in-stock") products = products.filter((product) => product.stock > 0);
  if (filters.trending) products = products.filter((product) => product.trending);
  if (filters.featured) products = products.filter((product) => product.featured);

  switch (filters.sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "best-selling":
      products.sort((a, b) => b.soldCount - a.soldCount);
      break;
    case "top-rated":
      products.sort((a, b) => b.averageRating - a.averageRating);
      break;
    default:
      products.sort((a, b) => String(a._id).localeCompare(String(b._id)));
  }

  return products;
};

export const getMockProductBySlug = (slug) => {
  const product = mockProducts.find((entry) => entry.slug === slug);
  if (!product) return null;
  const relatedProducts = mockProducts
    .filter((entry) => entry.slug !== slug && (entry.category.slug === product.category.slug || entry.brand.slug === product.brand.slug))
    .slice(0, 4);

  const reviews = [
    { _id: `review-${slug}-1`, userName: "Riya", rating: 5, comment: "Great quality for the price and category.", createdAt: new Date().toISOString() },
    { _id: `review-${slug}-2`, userName: "Arjun", rating: 4, comment: "Looks polished and feels much more locally relevant.", createdAt: new Date().toISOString() }
  ];

  return { product, relatedProducts, reviews };
};

export const getMockSuggestions = (query) =>
  getMockProducts({ search: query })
    .slice(0, 6)
    .map((product) => ({ _id: product._id, name: product.name, slug: product.slug, price: product.price, images: product.images }));

export const getMockPage = (slug) => mockContent.pages[slug] || null;
