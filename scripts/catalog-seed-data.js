const imageBank = {
  womenEthnic: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  menFashion: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  homeKitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
  bags: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
  watches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  decor: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  appliances: "https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=1200&q=80"
};

export const categorySeeds = [
  { name: "Women Ethnic", slug: "women-ethnic", description: "Everyday kurtas, sarees, and festive silhouettes chosen for Indian wardrobes.", image: imageBank.womenEthnic, featured: true },
  { name: "Men Fashion", slug: "men-fashion", description: "Polished menswear with easy fits for office, weekends, and festive dressing.", image: imageBank.menFashion, featured: true },
  { name: "Footwear", slug: "footwear", description: "Daily-wear shoes, sandals, and slip-ons with comfort-first styling.", image: imageBank.footwear, featured: true },
  { name: "Electronics", slug: "electronics", description: "Smart gadgets and audio picks that fit modern Indian lifestyles.", image: imageBank.electronics, featured: true },
  { name: "Beauty & Wellness", slug: "beauty-wellness", description: "Skincare, grooming, and beauty essentials for everyday routines.", image: imageBank.beauty, featured: true },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Practical kitchenware and dining upgrades for modern Indian homes.", image: imageBank.homeKitchen, featured: true },
  { name: "Bags & Luggage", slug: "bags-luggage", description: "Travel-ready trolleys, office backpacks, and compact everyday carry bags.", image: imageBank.bags, featured: true },
  { name: "Watches & Accessories", slug: "watches-accessories", description: "Stylish finishing pieces from watches to wallets and sunglasses.", image: imageBank.watches, featured: true },
  { name: "Home Decor", slug: "home-decor", description: "Soft furnishings and decor accents designed for warm, polished interiors.", image: imageBank.decor, featured: true },
  { name: "Appliances", slug: "appliances", description: "Trusted small appliances for fast cooking and everyday convenience.", image: imageBank.appliances, featured: true }
];

export const brandSeeds = [
  { name: "IndiWeave", slug: "indiweave", featured: true },
  { name: "Metro Mile", slug: "metro-mile", featured: true },
  { name: "StrideCraft", slug: "stridecraft", featured: true },
  { name: "Signal One", slug: "signal-one", featured: true },
  { name: "GlowNest", slug: "glownest", featured: true },
  { name: "HomeMitra", slug: "homemitra", featured: true },
  { name: "CarryCraft", slug: "carrycraft", featured: true },
  { name: "HourMark", slug: "hourmark", featured: true },
  { name: "RoomStory", slug: "roomstory", featured: true },
  { name: "SwiftServe", slug: "swiftserve", featured: true }
];

const makeProducts = (group) =>
  group.items.map((item) => ({
    ...item,
    categorySlug: group.categorySlug,
    brandSlug: group.brandSlug,
    image: group.image,
    description: item.description || `${item.shortDescription} Built for Indian shoppers with dependable quality and practical everyday use.`,
    specs: item.specs || group.specs,
    tags: item.tags || group.tags,
    colors: item.colors || group.colors,
    sizes: item.sizes || group.sizes,
    averageRating: item.averageRating || 4.4,
    reviewCount: item.reviewCount || 24
  }));

const catalogGroups = [
  {
    categorySlug: "women-ethnic",
    brandSlug: "indiweave",
    image: imageBank.womenEthnic,
    specs: { material: "Cotton blend", fit: "Comfort", warranty: "No warranty", care: "Machine wash", origin: "India" },
    tags: ["ethnic", "daily wear"],
    colors: ["Blue", "Pink", "Mustard"],
    sizes: ["S", "M", "L", "XL"],
    items: [
      { name: "Cotton Printed Kurta Set", slug: "cotton-printed-kurta-set", price: 1899, compareAtPrice: 2499, sku: "IN-WE-1001", stock: 22, soldCount: 86, featured: true, trending: true, shortDescription: "Easy cotton kurta, pant, and dupatta set for workdays and light occasions." },
      { name: "Festive Anarkali Kurta", slug: "festive-anarkali-kurta", price: 2799, compareAtPrice: 3499, sku: "IN-WE-1002", stock: 18, soldCount: 52, featured: true, shortDescription: "Flowy festive anarkali with subtle foil detailing and matching dupatta.", colors: ["Wine", "Teal"] },
      { name: "Chikankari Straight Kurta", slug: "chikankari-straight-kurta", price: 2199, compareAtPrice: 2899, sku: "IN-WE-1003", stock: 20, soldCount: 61, trending: true, shortDescription: "Soft embroidered kurta with a refined hand-finished look.", colors: ["White", "Powder Blue"] },
      { name: "Organza Saree with Border", slug: "organza-saree-with-border", price: 3299, compareAtPrice: 4199, sku: "IN-WE-1004", stock: 12, soldCount: 35, shortDescription: "Festive organza saree with a soft sheen and elegant woven border.", sizes: ["Free Size"], colors: ["Lavender", "Mint"] },
      { name: "Printed Co-ord Suit", slug: "printed-co-ord-suit", price: 2499, compareAtPrice: 3199, sku: "IN-WE-1005", stock: 16, soldCount: 48, trending: true, shortDescription: "Modern ethnic co-ord set with easy movement and day-long comfort.", colors: ["Coral", "Olive"] }
    ]
  },
  {
    categorySlug: "men-fashion",
    brandSlug: "metro-mile",
    image: imageBank.menFashion,
    specs: { material: "Cotton rich", fit: "Regular", warranty: "No warranty", care: "Machine wash", origin: "India" },
    tags: ["men", "casual"],
    colors: ["Black", "Navy", "Olive"],
    sizes: ["M", "L", "XL", "XXL"],
    items: [
      { name: "Linen Blend Casual Shirt", slug: "linen-blend-casual-shirt", price: 1499, compareAtPrice: 1999, sku: "IN-MF-2001", stock: 24, soldCount: 93, featured: true, shortDescription: "Smart summer shirt with a breathable linen blend and clean finish." },
      { name: "Everyday Polo T-Shirt", slug: "everyday-polo-tshirt", price: 999, compareAtPrice: 1399, sku: "IN-MF-2002", stock: 40, soldCount: 116, trending: true, shortDescription: "Clean polo neck tee built for daily wear, travel, and office Fridays." },
      { name: "Tapered Fit Jeans", slug: "tapered-fit-jeans", price: 1799, compareAtPrice: 2299, sku: "IN-MF-2003", stock: 26, soldCount: 74, shortDescription: "Stretch denim with a modern tapered fit and easy everyday comfort.", sizes: ["30", "32", "34", "36"], colors: ["Indigo", "Black"] },
      { name: "Festive Nehru Jacket", slug: "festive-nehru-jacket", price: 2599, compareAtPrice: 3299, sku: "IN-MF-2004", stock: 14, soldCount: 43, featured: true, shortDescription: "Lightly structured Nehru jacket for wedding functions and festive layering.", colors: ["Beige", "Navy"] },
      { name: "Cotton Pathani Kurta", slug: "cotton-pathani-kurta", price: 1999, compareAtPrice: 2499, sku: "IN-MF-2005", stock: 19, soldCount: 39, shortDescription: "Comfort-first pathani kurta for festive evenings and traditional occasions.", colors: ["Olive", "White"] }
    ]
  },
  {
    categorySlug: "footwear",
    brandSlug: "stridecraft",
    image: imageBank.footwear,
    specs: { material: "Mesh and EVA", fit: "True to size", warranty: "3 months", care: "Wipe clean", origin: "India" },
    tags: ["footwear", "comfort"],
    colors: ["Black", "Grey"],
    sizes: ["6", "7", "8", "9", "10"],
    items: [
      { name: "Air Cushion Running Sneakers", slug: "air-cushion-running-sneakers", price: 2399, compareAtPrice: 3199, sku: "IN-FW-3001", stock: 28, soldCount: 102, featured: true, trending: true, shortDescription: "Responsive everyday sneakers for gym runs, commute, and all-day walking." },
      { name: "City Loafers", slug: "city-loafers", price: 1999, compareAtPrice: 2699, sku: "IN-FW-3002", stock: 21, soldCount: 65, shortDescription: "Slip-on loafers with versatile styling for office and dinner dressing.", colors: ["Tan", "Black"] },
      { name: "Comfort Strap Sandals", slug: "comfort-strap-sandals", price: 1299, compareAtPrice: 1699, sku: "IN-FW-3003", stock: 32, soldCount: 89, shortDescription: "Soft footbed sandals made for hot days and long casual outings.", specs: { material: "PU upper", fit: "Regular", warranty: "No warranty", care: "Wipe clean", origin: "India" } },
      { name: "Formal Lace-Up Shoes", slug: "formal-lace-up-shoes", price: 2899, compareAtPrice: 3699, sku: "IN-FW-3004", stock: 15, soldCount: 47, shortDescription: "Classic formal shoes with smart polish for office and occasion wear.", colors: ["Black", "Oxblood"] },
      { name: "Weekend Slides", slug: "weekend-slides", price: 899, compareAtPrice: 1199, sku: "IN-FW-3005", stock: 45, soldCount: 124, trending: true, shortDescription: "Simple cushioned slides for home, travel, and everyday quick wear.", specs: { material: "EVA", fit: "Regular", warranty: "No warranty", care: "Washable", origin: "India" } }
    ]
  },
  {
    categorySlug: "electronics",
    brandSlug: "signal-one",
    image: imageBank.electronics,
    specs: { material: "ABS and metal", fit: "Portable", warranty: "1 year", care: "Keep dry", origin: "India" },
    tags: ["electronics", "gadgets"],
    colors: ["Black", "White"],
    sizes: ["Standard"],
    items: [
      { name: "True Wireless Earbuds", slug: "true-wireless-earbuds", price: 1799, compareAtPrice: 2499, sku: "IN-EL-4001", stock: 38, soldCount: 146, featured: true, trending: true, shortDescription: "Pocket-friendly TWS earbuds with low-latency mode and clear call pickup." },
      { name: "AMOLED Smart Watch", slug: "amoled-smart-watch", price: 3499, compareAtPrice: 4999, sku: "IN-EL-4002", stock: 27, soldCount: 118, featured: true, shortDescription: "Fitness smartwatch with AMOLED screen, notifications, and long battery life." },
      { name: "Portable Bluetooth Speaker", slug: "portable-bluetooth-speaker", price: 2299, compareAtPrice: 2999, sku: "IN-EL-4003", stock: 31, soldCount: 97, shortDescription: "Compact speaker with punchy audio and easy travel-friendly design." },
      { name: "65W Fast Wall Charger", slug: "65w-fast-wall-charger", price: 1499, compareAtPrice: 1999, sku: "IN-EL-4004", stock: 50, soldCount: 131, trending: true, shortDescription: "Fast multi-device charger built for phones, tablets, and travel bags." },
      { name: "Flex Neckband Earphones", slug: "flex-neckband-earphones", price: 1299, compareAtPrice: 1699, sku: "IN-EL-4005", stock: 43, soldCount: 109, shortDescription: "Lightweight neckband with good battery life and comfortable all-day wear." }
    ]
  },
  {
    categorySlug: "beauty-wellness",
    brandSlug: "glownest",
    image: imageBank.beauty,
    specs: { material: "Beauty formula", fit: "Daily routine", warranty: "No warranty", care: "Store cool", origin: "India" },
    tags: ["beauty", "wellness"],
    colors: ["Standard"],
    sizes: ["Standard"],
    items: [
      { name: "Vitamin C Face Wash", slug: "vitamin-c-face-wash", price: 349, compareAtPrice: 449, sku: "IN-BW-5001", stock: 70, soldCount: 164, trending: true, shortDescription: "Brightening face wash for everyday cleansing with a fresh, clean feel.", sizes: ["100 ml"] },
      { name: "SPF 50 Daily Sunscreen", slug: "spf-50-daily-sunscreen", price: 499, compareAtPrice: 649, sku: "IN-BW-5002", stock: 62, soldCount: 152, featured: true, shortDescription: "Lightweight sunscreen with no heavy white cast and easy daily wear.", sizes: ["50 g"] },
      { name: "Argan Hair Serum", slug: "argan-hair-serum", price: 549, compareAtPrice: 699, sku: "IN-BW-5003", stock: 44, soldCount: 96, shortDescription: "Light serum for smoother strands, shine, and frizz control.", sizes: ["80 ml"] },
      { name: "Longwear Lip Tint Duo", slug: "longwear-lip-tint-duo", price: 699, compareAtPrice: 899, sku: "IN-BW-5004", stock: 36, soldCount: 83, shortDescription: "Two versatile lip shades for everyday and evening use.", colors: ["Rose", "Berry"], sizes: ["2 x 4 ml"] },
      { name: "Beard Grooming Kit", slug: "beard-grooming-kit", price: 899, compareAtPrice: 1199, sku: "IN-BW-5005", stock: 33, soldCount: 58, shortDescription: "Daily beard kit with oil, balm, and grooming essentials.", sizes: ["Kit"] }
    ]
  },
  {
    categorySlug: "home-kitchen",
    brandSlug: "homemitra",
    image: imageBank.homeKitchen,
    specs: { material: "Household grade", fit: "Kitchen utility", warranty: "1 year", care: "Clean after use", origin: "India" },
    tags: ["home", "kitchen"],
    colors: ["Standard"],
    sizes: ["Standard"],
    items: [
      { name: "Nonstick Cookware Set", slug: "nonstick-cookware-set", price: 3499, compareAtPrice: 4499, sku: "IN-HK-6001", stock: 24, soldCount: 77, featured: true, shortDescription: "Kitchen starter set with nonstick pans and daily-cooking utility.", sizes: ["5 pieces"] },
      { name: "Stainless Steel Pressure Cooker", slug: "stainless-steel-pressure-cooker", price: 2299, compareAtPrice: 2899, sku: "IN-HK-6002", stock: 26, soldCount: 91, shortDescription: "Durable pressure cooker for dal, rice, and daily home cooking.", sizes: ["5 L"], colors: ["Steel"] },
      { name: "Glass Storage Canister Set", slug: "glass-storage-canister-set", price: 999, compareAtPrice: 1399, sku: "IN-HK-6003", stock: 38, soldCount: 69, shortDescription: "Countertop jar set for spices, snacks, and pantry organization.", sizes: ["4 pieces"], colors: ["Clear"] },
      { name: "Stoneware Dinner Plate Set", slug: "stoneware-dinner-plate-set", price: 1699, compareAtPrice: 2199, sku: "IN-HK-6004", stock: 29, soldCount: 54, shortDescription: "Modern stoneware plates for family dinners and everyday hosting.", sizes: ["6 pieces"], colors: ["Ivory", "Grey"] },
      { name: "Chef Knife Trio", slug: "chef-knife-trio", price: 1299, compareAtPrice: 1699, sku: "IN-HK-6005", stock: 35, soldCount: 63, shortDescription: "Essential kitchen knife set for prep, chopping, and fast daily cooking.", sizes: ["3 pieces"] }
    ]
  },
  {
    categorySlug: "bags-luggage",
    brandSlug: "carrycraft",
    image: imageBank.bags,
    specs: { material: "Travel-grade build", fit: "Everyday carry", warranty: "1 year", care: "Wipe clean", origin: "India" },
    tags: ["bags", "travel"],
    colors: ["Black", "Grey"],
    sizes: ["Standard"],
    items: [
      { name: "Urban Office Backpack", slug: "urban-office-backpack", price: 1999, compareAtPrice: 2599, sku: "IN-BL-7001", stock: 27, soldCount: 110, featured: true, shortDescription: "Laptop-ready office backpack with padded straps and smart inner organization.", sizes: ["22 L"] },
      { name: "Cabin Trolley Bag", slug: "cabin-trolley-bag", price: 4299, compareAtPrice: 5499, sku: "IN-BL-7002", stock: 19, soldCount: 57, trending: true, shortDescription: "Smooth-rolling hardcase cabin bag designed for short trips and flights.", sizes: ["Cabin"], colors: ["Navy", "Silver"] },
      { name: "Crossbody Sling Bag", slug: "crossbody-sling-bag", price: 1299, compareAtPrice: 1699, sku: "IN-BL-7003", stock: 42, soldCount: 84, shortDescription: "Compact sling bag for phone, wallet, and light everyday essentials.", colors: ["Tan", "Black"] },
      { name: "Travel Duffel Bag", slug: "travel-duffel-bag", price: 1899, compareAtPrice: 2399, sku: "IN-BL-7004", stock: 30, soldCount: 73, shortDescription: "Weekend-ready duffel bag with roomy main compartment and strong carry straps.", sizes: ["38 L"], colors: ["Olive", "Black"] },
      { name: "Laptop Tote Bag", slug: "laptop-tote-bag", price: 2199, compareAtPrice: 2899, sku: "IN-BL-7005", stock: 24, soldCount: 51, shortDescription: "Structured tote with enough room for a laptop and daily office carry.", sizes: ["15 inch"], colors: ["Mocha", "Black"] }
    ]
  },
  {
    categorySlug: "watches-accessories",
    brandSlug: "hourmark",
    image: imageBank.watches,
    specs: { material: "Accessory build", fit: "Daily wear", warranty: "1 year", care: "Keep dry", origin: "India" },
    tags: ["accessories", "watch"],
    colors: ["Black", "Brown"],
    sizes: ["Standard"],
    items: [
      { name: "Classic Analog Watch", slug: "classic-analog-watch", price: 2499, compareAtPrice: 3199, sku: "IN-WA-8001", stock: 22, soldCount: 68, featured: true, shortDescription: "Clean analog watch with an understated dial for daily and office wear." },
      { name: "Metal Strap Dress Watch", slug: "metal-strap-dress-watch", price: 2999, compareAtPrice: 3899, sku: "IN-WA-8002", stock: 18, soldCount: 49, shortDescription: "A polished dress watch with a sleek bracelet strap and formal finish.", colors: ["Silver", "Rose Gold"] },
      { name: "Leather Wallet", slug: "leather-wallet", price: 899, compareAtPrice: 1299, sku: "IN-WA-8003", stock: 40, soldCount: 94, trending: true, shortDescription: "Compact wallet with neat organization for cash, cards, and IDs." },
      { name: "UV Shield Sunglasses", slug: "uv-shield-sunglasses", price: 1199, compareAtPrice: 1599, sku: "IN-WA-8004", stock: 34, soldCount: 79, shortDescription: "Easy-to-style sunglasses for sunny commutes, travel, and regular weekend wear." },
      { name: "Minimal Bracelet Set", slug: "minimal-bracelet-set", price: 699, compareAtPrice: 999, sku: "IN-WA-8005", stock: 48, soldCount: 66, shortDescription: "A simple bracelet duo that layers well with watches and festive styling.", colors: ["Gold", "Silver"] }
    ]
  },
  {
    categorySlug: "home-decor",
    brandSlug: "roomstory",
    image: imageBank.decor,
    specs: { material: "Decor-grade build", fit: "Indoor styling", warranty: "No warranty", care: "Dust gently", origin: "India" },
    tags: ["decor", "home"],
    colors: ["Beige", "Taupe"],
    sizes: ["Standard"],
    items: [
      { name: "Textured Table Lamp", slug: "textured-table-lamp", price: 2499, compareAtPrice: 3199, sku: "IN-HD-9001", stock: 20, soldCount: 46, featured: true, shortDescription: "Soft ambient lamp with a warm neutral look for bedrooms and side tables." },
      { name: "Embroidered Cushion Cover Set", slug: "embroidered-cushion-cover-set", price: 999, compareAtPrice: 1399, sku: "IN-HD-9002", stock: 31, soldCount: 71, shortDescription: "Decorative cushion cover set that refreshes sofas and reading corners quickly.", sizes: ["16 x 16"], colors: ["Rust", "Ivory"] },
      { name: "Accent Wall Mirror", slug: "accent-wall-mirror", price: 3199, compareAtPrice: 4099, sku: "IN-HD-9003", stock: 14, soldCount: 37, shortDescription: "Rounded wall mirror that brightens entryways, bedrooms, and compact spaces.", sizes: ["24 inch"], colors: ["Walnut"] },
      { name: "Ceramic Planter Pair", slug: "ceramic-planter-pair", price: 1299, compareAtPrice: 1699, sku: "IN-HD-9004", stock: 26, soldCount: 58, shortDescription: "Modern ceramic planter pair for shelves, balconies, and indoor green corners.", sizes: ["2 pieces"], colors: ["White", "Olive"] },
      { name: "Soft Throw Blanket", slug: "soft-throw-blanket", price: 1499, compareAtPrice: 1999, sku: "IN-HD-9005", stock: 28, soldCount: 63, shortDescription: "Cozy throw for sofa corners, movie nights, and air-conditioned rooms.", sizes: ["50 x 60"], colors: ["Taupe", "Grey"] }
    ]
  },
  {
    categorySlug: "appliances",
    brandSlug: "swiftserve",
    image: imageBank.appliances,
    specs: { material: "Appliance-grade build", fit: "Countertop use", warranty: "1 year", care: "Wipe after use", origin: "India" },
    tags: ["appliances", "kitchen"],
    colors: ["Black", "Silver"],
    sizes: ["Standard"],
    items: [
      { name: "750W Mixer Grinder", slug: "750w-mixer-grinder", price: 3499, compareAtPrice: 4499, sku: "IN-AP-10001", stock: 25, soldCount: 104, featured: true, shortDescription: "Powerful mixer grinder for masalas, chutneys, and everyday kitchen prep.", sizes: ["3 jars"] },
      { name: "Induction Cooktop", slug: "induction-cooktop", price: 2599, compareAtPrice: 3299, sku: "IN-AP-10002", stock: 29, soldCount: 89, shortDescription: "Compact induction stove with quick heat-up and straightforward controls." },
      { name: "Electric Kettle", slug: "electric-kettle", price: 1499, compareAtPrice: 1999, sku: "IN-AP-10003", stock: 37, soldCount: 97, trending: true, shortDescription: "Fast-boil electric kettle for tea, coffee, and instant meals.", sizes: ["1.5 L"] },
      { name: "Digital Air Fryer", slug: "digital-air-fryer", price: 5499, compareAtPrice: 6999, sku: "IN-AP-10004", stock: 18, soldCount: 55, shortDescription: "Air fryer with digital controls for fast snacks, roasting, and low-oil meals.", sizes: ["4.5 L"] },
      { name: "Steam Iron", slug: "steam-iron", price: 1899, compareAtPrice: 2499, sku: "IN-AP-10005", stock: 33, soldCount: 62, shortDescription: "Daily-use steam iron for shirts, kurtas, and quick garment touch-ups.", colors: ["Blue", "White"] }
    ]
  }
];

export const productSeeds = catalogGroups.flatMap(makeProducts);

export const contentSeeds = {
  banner: {
    title: "Shopping that feels made for India",
    subtitle: "Fashion, gadgets, and home picks you actually want",
    description: "Browse a broader catalogue with better everyday essentials, local pricing in rupees, and a smoother premium shopping experience across mobile and desktop.",
    image: imageBank.womenEthnic,
    ctaLabel: "Shop the new arrivals",
    ctaLink: "/shop",
    theme: "sand",
    active: true,
    order: 1
  },
  testimonials: [
    { name: "Riya Mehta", role: "Frequent shopper", quote: "The mix of ethnic wear, gadgets, and home picks feels much closer to how I actually shop online." },
    { name: "Arjun Nair", role: "Working professional", quote: "The rupee pricing and cleaner catalogue instantly made the storefront feel more local and usable." },
    { name: "Neha Sharma", role: "Home stylist", quote: "The product cards look sharper now and the decor section finally feels complete." }
  ]
};
