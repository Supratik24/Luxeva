import "dotenv/config";
import mongoose from "mongoose";
import User from "../services/auth-service/src/models/User.js";
import Address from "../services/auth-service/src/models/Address.js";
import Category from "../services/catalog-service/src/models/Category.js";
import Brand from "../services/catalog-service/src/models/Brand.js";
import Product from "../services/catalog-service/src/models/Product.js";
import Coupon from "../services/catalog-service/src/models/Coupon.js";
import Review from "../services/catalog-service/src/models/Review.js";
import Wishlist from "../services/catalog-service/src/models/Wishlist.js";
import Banner from "../services/content-service/src/models/Banner.js";
import ContentBlock from "../services/content-service/src/models/ContentBlock.js";
import Cart from "../services/order-service/src/models/Cart.js";
import Order from "../services/order-service/src/models/Order.js";
import Notification from "../services/notification-service/src/models/Notification.js";

const connect = async (uri) => {
  await mongoose.disconnect().catch(() => undefined);
  await mongoose.connect(uri);
};

const seedAuth = async () => {
  await connect(process.env.MONGO_URI || "mongodb://localhost:27017/luxeva-auth");
  await Promise.all([User.deleteMany({}), Address.deleteMany({})]);

  const admin = await User.create({
    name: "Ava Merchant",
    email: "admin@luxeva.com",
    password: "Admin@123",
    phone: "+91 99999 11111",
    role: "admin"
  });

  const customer = await User.create({
    name: "Maya Chen",
    email: "maya@luxeva.com",
    password: "User@123",
    phone: "+91 99999 22222"
  });

  await Address.create({
    user: customer._id,
    label: "Home",
    fullName: "Maya Chen",
    line1: "17 Lakeview Residency",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "India",
    phone: "+91 99999 22222",
    isDefault: true
  });

  return { admin, customer };
};

const seedCatalog = async (customer) => {
  await connect(process.env.CATALOG_MONGO_URI || "mongodb://localhost:27017/luxeva-catalog");
  await Promise.all([
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({})
  ]);

  const categories = await Category.insertMany([
    {
      name: "Outerwear",
      slug: "outerwear",
      description: "Layered silhouettes with premium finishing.",
      featured: true
    },
    {
      name: "Footwear",
      slug: "footwear",
      description: "Clean lines, comfort, and subtle statement design.",
      featured: true
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Small luxuries that complete the look.",
      featured: true
    },
    {
      name: "Home Edit",
      slug: "home-edit",
      description: "Soft forms and refined utility for interiors.",
      featured: true
    }
  ]);

  const brands = await Brand.insertMany([
    { name: "Atelier North", slug: "atelier-north", featured: true },
    { name: "Velour House", slug: "velour-house", featured: true },
    { name: "Drift Studio", slug: "drift-studio", featured: true }
  ]);

  const products = await Product.insertMany([
    {
      name: "Cashmere Blend Trench",
      slug: "cashmere-blend-trench",
      shortDescription: "A softly tailored trench with a fluid drape and warm tonal finish.",
      description: "Designed for transitional weather with a premium brushed surface, lined interior, and understated detailing that works day to evening.",
      category: categories[0]._id,
      brand: brands[0]._id,
      images: [
        { url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80", alt: "Trench coat" }
      ],
      price: 249,
      compareAtPrice: 319,
      discountPercent: 22,
      sku: "LX-TR-1001",
      stock: 12,
      soldCount: 48,
      featured: true,
      trending: true,
      tags: ["coat", "winter", "luxury"],
      colors: ["Oat", "Espresso"],
      sizes: ["S", "M", "L"],
      averageRating: 4.8,
      reviewCount: 16,
      flashSaleEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
      specs: {
        material: "Wool blend",
        fit: "Relaxed",
        warranty: "1 year",
        care: "Dry clean",
        origin: "Italy"
      }
    },
    {
      name: "Sculpt Leather Sneaker",
      slug: "sculpt-leather-sneaker",
      shortDescription: "Minimal sneaker design with premium leather and cushioned support.",
      description: "A clean low-profile silhouette with supple leather, subtle branding, and a comfort-focused footbed.",
      category: categories[1]._id,
      brand: brands[1]._id,
      images: [
        { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80", alt: "Leather sneaker" }
      ],
      price: 179,
      compareAtPrice: 229,
      sku: "LX-SN-2001",
      stock: 8,
      soldCount: 67,
      featured: true,
      trending: true,
      tags: ["sneaker", "leather", "minimal"],
      colors: ["Ivory", "Onyx"],
      sizes: ["40", "41", "42", "43"],
      averageRating: 4.7,
      reviewCount: 24,
      specs: {
        material: "Full-grain leather",
        fit: "True to size",
        warranty: "6 months",
        care: "Wipe clean",
        origin: "Portugal"
      }
    },
    {
      name: "Stoneware Aura Lamp",
      slug: "stoneware-aura-lamp",
      shortDescription: "Ambient table lamp with sculptural ceramic body and linen shade.",
      description: "Soft diffused light, textured finish, and a calm neutral palette designed for refined interior settings.",
      category: categories[3]._id,
      brand: brands[2]._id,
      images: [
        { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80", alt: "Designer lamp" }
      ],
      price: 129,
      compareAtPrice: 159,
      sku: "LX-HM-3001",
      stock: 21,
      soldCount: 19,
      featured: false,
      trending: true,
      tags: ["home", "lamp", "decor"],
      colors: ["Sandstone"],
      sizes: ["Standard"],
      averageRating: 4.9,
      reviewCount: 9,
      specs: {
        material: "Ceramic and linen",
        fit: "Tabletop",
        warranty: "1 year",
        care: "Dust gently",
        origin: "Japan"
      }
    },
    {
      name: "Contour Carry Bag",
      slug: "contour-carry-bag",
      shortDescription: "Structured daily bag with refined hardware and soft-grain texture.",
      description: "Designed to move from commute to dinner with quiet confidence, smart compartments, and effortless polish.",
      category: categories[2]._id,
      brand: brands[0]._id,
      images: [
        { url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80", alt: "Leather bag" }
      ],
      price: 199,
      compareAtPrice: 249,
      sku: "LX-AC-4001",
      stock: 6,
      soldCount: 55,
      featured: true,
      trending: false,
      tags: ["bag", "accessory", "structured"],
      colors: ["Cocoa", "Black"],
      sizes: ["One size"],
      averageRating: 4.6,
      reviewCount: 13,
      specs: {
        material: "Textured leather",
        fit: "Handheld",
        warranty: "1 year",
        care: "Leather conditioner",
        origin: "Spain"
      }
    }
  ]);

  await Coupon.create({
    code: "LUXE10",
    description: "10% off for first-time customers",
    type: "percentage",
    value: 10,
    minOrderAmount: 100,
    active: true
  });

  await Review.insertMany([
    {
      product: products[0]._id,
      userId: customer._id,
      userName: customer.name,
      rating: 5,
      title: "Beautiful finish",
      comment: "The fabric and shape feel premium immediately.",
      status: "approved"
    },
    {
      product: products[1]._id,
      userId: customer._id,
      userName: customer.name,
      rating: 4,
      title: "Really comfortable",
      comment: "Great cushioning and very easy to style.",
      status: "approved"
    }
  ]);

  await Wishlist.create({
    userId: customer._id,
    products: [products[0]._id, products[3]._id]
  });

  return { categories, brands, products };
};

const seedContent = async () => {
  await connect(process.env.CONTENT_MONGO_URI || "mongodb://localhost:27017/luxeva-content");
  await Promise.all([Banner.deleteMany({}), ContentBlock.deleteMany({})]);

  await Banner.create({
    title: "Quiet luxury for everyday movement",
    subtitle: "Seasonal essentials, elevated",
    description: "Refined products across fashion, accessories, and home with a premium responsive experience from browsing to checkout.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80",
    ctaLabel: "Discover the edit",
    ctaLink: "/shop",
    theme: "sand",
    active: true,
    order: 1
  });

  await ContentBlock.insertMany([
    {
      key: "testimonials",
      title: "Customer love",
      items: [
        { name: "Noah Bennett", role: "Creative director", quote: "It feels closer to a luxury editorial experience than a standard storefront." },
        { name: "Ira Kapoor", role: "Interior stylist", quote: "The product detail and checkout flow are both incredibly smooth." },
        { name: "Sara Lin", role: "Repeat customer", quote: "Fast to browse, beautiful on mobile, and the admin side feels truly usable." }
      ]
    },
    {
      key: "faq",
      title: "Frequently asked questions",
      items: [
        { question: "How long does shipping take?", answer: "Domestic orders usually arrive in 3 to 5 business days depending on your location." },
        { question: "Can I update my order after checkout?", answer: "You can contact support quickly after placing the order and we’ll help if fulfillment has not started." },
        { question: "How are admin routes secured?", answer: "Admin pages are protected in the frontend and every admin API route is enforced with backend role-based authorization." }
      ]
    },
    {
      key: "about",
      title: "Premium commerce, designed properly",
      subtitle: "Luxeva combines a polished storefront with secure service-oriented operations."
    },
    {
      key: "terms",
      title: "Terms & Conditions",
      items: [
        { heading: "Orders", content: "Orders are subject to availability, verification, and payment confirmation." },
        { heading: "Accounts", content: "Users are responsible for safeguarding account credentials and activity." }
      ]
    },
    {
      key: "privacy",
      title: "Privacy Policy",
      items: [
        { heading: "Data usage", content: "We use account and order data to deliver the service, support requests, and improve the product." },
        { heading: "Security", content: "Authentication relies on hashed passwords, JWTs, and protected service routes." }
      ]
    }
  ]);
};

const seedOrders = async (customer, products) => {
  await connect(process.env.ORDER_MONGO_URI || "mongodb://localhost:27017/luxeva-order");
  await Promise.all([Cart.deleteMany({}), Order.deleteMany({})]);

  await Cart.create({
    userId: customer._id,
    items: [
      {
        productId: products[2]._id,
        name: products[2].name,
        slug: products[2].slug,
        image: products[2].images[0].url,
        price: products[2].price,
        quantity: 1
      }
    ],
    subtotal: products[2].price,
    shippingFee: 18,
    tax: 15.48,
    total: 162.48
  });

  await Order.create({
    orderNumber: "LX-SEED-1001",
    userId: customer._id,
    customer: { name: customer.name, email: customer.email },
    items: [
      {
        productId: products[0]._id,
        name: products[0].name,
        slug: products[0].slug,
        image: products[0].images[0].url,
        price: products[0].price,
        quantity: 1,
        color: "Oat",
        size: "M"
      }
    ],
    shippingAddress: {
      fullName: "Maya Chen",
      line1: "17 Lakeview Residency",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      phone: "+91 99999 22222"
    },
    billingAddress: {
      fullName: "Maya Chen",
      line1: "17 Lakeview Residency",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India",
      phone: "+91 99999 22222"
    },
    payment: {
      method: "card",
      status: "paid",
      transactionId: "pi_seed_1001"
    },
    status: "shipped",
    timeline: [
      { status: "placed", note: "Seed order placed" },
      { status: "packed", note: "Packed by warehouse" },
      { status: "shipped", note: "In transit" }
    ],
    subtotal: products[0].price,
    discount: 24.9,
    shippingFee: 0,
    tax: 29.88,
    total: 253.98,
    couponCode: "LUXE10"
  });
};

const seedNotifications = async (customer) => {
  await connect(process.env.NOTIFICATION_MONGO_URI || "mongodb://localhost:27017/luxeva-notifications");
  await Notification.deleteMany({});

  await Notification.insertMany([
    {
      userId: customer._id,
      type: "order",
      title: "Order confirmed",
      message: "Your order LX-SEED-1001 has been confirmed.",
      link: "/dashboard?tab=orders"
    },
    {
      userId: customer._id,
      type: "promo",
      title: "Flash sale live",
      message: "Selected pieces are now on a limited-time discount.",
      link: "/shop?sort=best-selling"
    }
  ]);
};

const run = async () => {
  const { customer } = await seedAuth();
  const { products } = await seedCatalog(customer);
  await seedContent();
  await seedOrders(customer, products);
  await seedNotifications(customer);
  await mongoose.disconnect();
  console.log("Seeded Luxeva microservices data successfully.");
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
