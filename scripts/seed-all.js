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
import { brandSeeds, categorySeeds, contentSeeds, productSeeds } from "./catalog-seed-data.js";

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

  const categories = await Category.insertMany(categorySeeds);
  const brands = await Brand.insertMany(brandSeeds);
  const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category._id]));
  const brandMap = Object.fromEntries(brands.map((brand) => [brand.slug, brand._id]));

  const products = await Product.insertMany(
    productSeeds.map((product) => ({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      category: categoryMap[product.categorySlug],
      brand: brandMap[product.brandSlug],
      images: [{ url: product.image, alt: product.name }],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      discountPercent: product.compareAtPrice
        ? Math.max(0, Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100))
        : 0,
      sku: product.sku,
      stock: product.stock,
      soldCount: product.soldCount,
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      tags: product.tags,
      colors: product.colors,
      sizes: product.sizes,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      flashSaleEndsAt: product.featured || product.trending ? new Date(Date.now() + 1000 * 60 * 60 * 48) : undefined,
      specs: product.specs,
      seo: {
        title: `${product.name} | Luxeva`,
        description: product.shortDescription
      }
    }))
  );

  await Coupon.create({
    code: "LUXE10",
    description: "10% off for first-time customers",
    type: "percentage",
    value: 10,
    minOrderAmount: 2499,
    active: true
  });

  await Review.insertMany([
    {
      product: products[0]._id,
      userId: customer._id,
      userName: customer.name,
      rating: 5,
      title: "Great everyday pick",
      comment: "The fit, finish, and price all feel much better matched for regular shopping.",
      status: "approved"
    },
    {
      product: products[1]._id,
      userId: customer._id,
      userName: customer.name,
      rating: 4,
      title: "Good value",
      comment: "The catalogue feels more practical now and the product quality still looks polished.",
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

  await Banner.create(contentSeeds.banner);

  await ContentBlock.insertMany([
    {
      key: "testimonials",
      title: "Customer love",
      items: contentSeeds.testimonials
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

  const cartProduct = products.find((product) => product.slug === "spf-50-daily-sunscreen") || products[0];
  const orderProduct = products.find((product) => product.slug === "cotton-printed-kurta-set") || products[0];

  await Cart.create({
    userId: customer._id,
    items: [
      {
        productId: cartProduct._id,
        name: cartProduct.name,
        slug: cartProduct.slug,
        image: cartProduct.images[0].url,
        price: cartProduct.price,
        quantity: 1
      }
    ],
    subtotal: cartProduct.price,
    shippingFee: 99,
    tax: 90,
    total: cartProduct.price + 99 + 90
  });

  await Order.create({
    orderNumber: "LX-SEED-1001",
    userId: customer._id,
    customer: { name: customer.name, email: customer.email },
    items: [
      {
        productId: orderProduct._id,
        name: orderProduct.name,
        slug: orderProduct.slug,
        image: orderProduct.images[0].url,
        price: orderProduct.price,
        quantity: 1,
        color: "Blue",
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
    subtotal: orderProduct.price,
    discount: 190,
    shippingFee: 0,
    tax: 342,
    total: orderProduct.price - 190 + 342,
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
