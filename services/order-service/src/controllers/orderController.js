import crypto from "crypto";
import axios from "axios";
import mongoose from "mongoose";
import {
  ApiError,
  asyncHandler,
  getRedis,
  publishEvent,
  sendSuccess
} from "@luxeva/shared";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { emitOrderUpdate } from "../socket.js";

const fallbackCarts = new Map();
const fallbackOrders = [
  {
    _id: "ord_fb_101",
    orderNumber: "LX-1001",
    status: "delivered",
    items: [{ productId: "p_silk_kurta", name: "Handcrafted Silk Kurta", price: 2999, quantity: 1, image: "" }],
    total: 3450,
    customer: { name: "Supratik Sangram", email: "supratiksangram9@gmail.com" },
    shipping: { address: { city: "Kolkata", state: "West Bengal" }, carrier: "BlueDart", trackingNumber: "BD99281726" },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 5) },
      { status: "packed", note: "Packed at hub", at: new Date(Date.now() - 86400000 * 4) },
      { status: "shipped", note: "Handed over to BlueDart", at: new Date(Date.now() - 86400000 * 3) },
      { status: "out_for_delivery", note: "Out for delivery with agent", at: new Date(Date.now() - 86400000 * 2) },
      { status: "delivered", note: "Delivered to customer", at: new Date(Date.now() - 86400000 * 1) }
    ]
  },
  {
    _id: "ord_fb_102",
    orderNumber: "LX-1002",
    status: "shipped",
    items: [{ productId: "p_loafers", name: "Leather Formal Loafers", price: 3499, quantity: 1, image: "" }],
    total: 4015,
    customer: { name: "Ananya Sharma", email: "ananya.sharma@example.com" },
    shipping: { address: { city: "Bengaluru", state: "Karnataka" }, carrier: "Delhivery", trackingNumber: "DL88291024" },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    timeline: [
      { status: "placed", note: "Order placed successfully", at: new Date(Date.now() - 86400000 * 2) },
      { status: "packed", note: "Order packed in eco-friendly packaging", at: new Date(Date.now() - 86400000 * 1.5) },
      { status: "shipped", note: "Shipped via Delhivery Express", at: new Date(Date.now() - 86400000 * 1) }
    ]
  },
  {
    _id: "ord_fb_103",
    orderNumber: "LX-1003",
    status: "out_for_delivery",
    items: [{ productId: "p_watch", name: "Analog Minimalist Watch", price: 4299, quantity: 1, image: "" }],
    total: 4899,
    customer: { name: "Rahul Verma", email: "rahul.verma@example.com" },
    shipping: { address: { city: "Mumbai", state: "Maharashtra" }, carrier: "BlueDart", trackingNumber: "BD77182910" },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 3) },
      { status: "packed", note: "Packed at central fulfillment center", at: new Date(Date.now() - 86400000 * 2) },
      { status: "shipped", note: "In transit to delivery hub", at: new Date(Date.now() - 86400000 * 1) },
      { status: "out_for_delivery", note: "Out for delivery today", at: new Date() }
    ]
  },
  {
    _id: "ord_fb_104",
    orderNumber: "LX-1004",
    status: "placed",
    items: [{ productId: "p_cashmere_coat", name: "Cashmere Wool Overcoat", price: 8999, quantity: 1, image: "" }],
    total: 10078,
    customer: { name: "Pooja Hegde", email: "pooja.hegde@luxury.in" },
    shipping: { address: { city: "Hyderabad", state: "Telangana" }, carrier: "Delhivery", trackingNumber: "DL90214811" },
    createdAt: new Date(Date.now() - 86400000 * 0.4).toISOString(),
    timeline: [
      { status: "placed", note: "Payment verified, order placed", at: new Date(Date.now() - 86400000 * 0.4) }
    ]
  },
  {
    _id: "ord_fb_105",
    orderNumber: "LX-1005",
    status: "cancelled",
    items: [{ productId: "p_silk_gown", name: "Silk Evening Gown", price: 5499, quantity: 1, image: "" }],
    total: 6158,
    customer: { name: "Simran Kapoor", email: "simran.k@outlook.com" },
    shipping: { address: { city: "New Delhi", state: "Delhi" }, carrier: "BlueDart", trackingNumber: "BD55432109" },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    timeline: [
      { status: "placed", note: "Order placed", at: new Date(Date.now() - 86400000 * 4) },
      { status: "cancelled", note: "Cancelled by customer before dispatch", at: new Date(Date.now() - 86400000 * 3.8) }
    ]
  },
  {
    _id: "ord_fb_106",
    orderNumber: "LX-1006",
    status: "delivered",
    items: [{ productId: "p_silk_kurta", name: "Handcrafted Silk Kurta", price: 2999, quantity: 2, image: "" }],
    total: 6718,
    customer: { name: "Vikram Malhotra", email: "vikram.m@gmail.com" },
    shipping: { address: { city: "Pune", state: "Maharashtra" }, carrier: "BlueDart", trackingNumber: "BD66554433" },
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 8) },
      { status: "packed", note: "Packed", at: new Date(Date.now() - 86400000 * 7) },
      { status: "shipped", note: "Shipped", at: new Date(Date.now() - 86400000 * 6) },
      { status: "delivered", note: "Delivered", at: new Date(Date.now() - 86400000 * 4) }
    ]
  },
  {
    _id: "ord_fb_107",
    orderNumber: "LX-1007",
    status: "packed",
    items: [{ productId: "p_silk_kurta", name: "Handcrafted Silk Kurta", price: 2999, quantity: 1, image: "" }],
    total: 3450,
    customer: { name: "Rohit Deshmukh", email: "rohit.d@gmail.com" },
    shipping: { address: { city: "Nagpur", state: "Maharashtra" }, carrier: "Delhivery", trackingNumber: "DL33445566" },
    createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString(),
    timeline: [
      { status: "placed", note: "Order placed", at: new Date(Date.now() - 86400000 * 1.2) },
      { status: "packed", note: "Packed at warehouse", at: new Date(Date.now() - 86400000 * 0.8) }
    ]
  },
  {
    _id: "ord_fb_108",
    orderNumber: "LX-1008",
    status: "delivered",
    items: [{ productId: "p_scarf", name: "Pure Mulberry Silk Scarf", price: 1899, quantity: 2, image: "" }],
    total: 4253,
    customer: { name: "Meera Sen", email: "meera.sen@yahoo.com" },
    shipping: { address: { city: "Chennai", state: "Tamil Nadu" }, carrier: "BlueDart", trackingNumber: "BD22110099" },
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 12) },
      { status: "delivered", note: "Delivered safely", at: new Date(Date.now() - 86400000 * 8) }
    ]
  },
  {
    _id: "ord_fb_109",
    orderNumber: "LX-1009",
    status: "delivered",
    items: [{ productId: "p_watch", name: "Analog Minimalist Watch", price: 4299, quantity: 1, image: "" }],
    total: 4899,
    customer: { name: "Aditya Roy", email: "aditya.roy@luxeva.com" },
    shipping: { address: { city: "Jaipur", state: "Rajasthan" }, carrier: "Delhivery", trackingNumber: "DL11223344" },
    createdAt: new Date(Date.now() - 86400000 * 16).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 16) },
      { status: "delivered", note: "Delivered", at: new Date(Date.now() - 86400000 * 12) }
    ]
  },
  {
    _id: "ord_fb_110",
    orderNumber: "LX-1010",
    status: "delivered",
    items: [{ productId: "p_silk_kurta", name: "Handcrafted Silk Kurta", price: 2999, quantity: 1, image: "" }],
    total: 3450,
    customer: { name: "Kavita Rao", email: "kavita.rao@gmail.com" },
    shipping: { address: { city: "Ahmedabad", state: "Gujarat" }, carrier: "BlueDart", trackingNumber: "BD44332211" },
    createdAt: new Date(Date.now() - 86400000 * 22).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 22) },
      { status: "delivered", note: "Delivered", at: new Date(Date.now() - 86400000 * 18) }
    ]
  },
  {
    _id: "ord_fb_111",
    orderNumber: "LX-1011",
    status: "cancelled",
    items: [{ productId: "p_loafers", name: "Leather Formal Loafers", price: 3499, quantity: 1, image: "" }],
    total: 4015,
    customer: { name: "Tarun Gill", email: "tarun.gill@rediffmail.com" },
    shipping: { address: { city: "Chandigarh", state: "Punjab" }, carrier: "Delhivery", trackingNumber: "DL77889900" },
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    timeline: [
      { status: "placed", note: "Order confirmed", at: new Date(Date.now() - 86400000 * 25) },
      { status: "cancelled", note: "Customer changed delivery address, reordered", at: new Date(Date.now() - 86400000 * 24) }
    ]
  },
  {
    _id: "ord_fb_112",
    orderNumber: "LX-1012",
    status: "delivered",
    items: [{ productId: "p_watch", name: "Analog Minimalist Watch", price: 4299, quantity: 2, image: "" }],
    total: 9630,
    customer: { name: "Siddharth Sen", email: "siddharth.sen@gmail.com" },
    shipping: { address: { city: "Kolkata", state: "West Bengal" }, carrier: "BlueDart", trackingNumber: "BD88990011" },
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
    timeline: [
      { status: "placed", note: "Order placed", at: new Date(Date.now() - 86400000 * 35) },
      { status: "delivered", note: "Delivered", at: new Date(Date.now() - 86400000 * 30) }
    ]
  }
];
const razorpayManagedMethods = new Set(["razorpay", "netbanking", "wallet", "paylater"]);

const isOrderFallbackMode = () => process.env.ORDER_FALLBACK_MODE === "memory" || mongoose.connection.readyState !== 1;
const normalizeOrderItem = (item = {}) => ({
  productId: String(item.productId || ""),
  name: String(item.name || "Product"),
  slug: String(item.slug || ""),
  image: String(item.image || ""),
  price: Number(item.price || 0),
  quantity: Math.max(Number(item.quantity || 1), 1),
  color: item.color ? String(item.color) : "",
  size: item.size ? String(item.size) : ""
});

const computeTotals = (items, coupon = null) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 2499 ? 0 : 99;
  const tax = Number((subtotal * 0.12).toFixed(2));
  const discount = coupon?.discountAmount || 0;
  const total = Math.max(Number((subtotal + shippingFee + tax - discount).toFixed(2)), 0);

  return { subtotal, shippingFee, tax, discount, total };
};

const createOrderNumber = () => `LX-${Date.now()}`;

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new ApiError(500, "Razorpay is not configured");
  }

  return { keyId, keySecret };
};

const verifyRazorpaySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const { keySecret } = getRazorpayConfig();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment verification data");
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(razorpay_signature, "hex");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new ApiError(400, "Razorpay payment verification failed");
  }
};

export const getCart = asyncHandler(async (req, res) => {
  if (isOrderFallbackMode()) {
    const cart = fallbackCarts.get(req.user.id) || {
      userId: req.user.id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      tax: 0,
      total: 0,
      coupon: null
    };
    sendSuccess(res, 200, "Cart fetched successfully", { cart });
    return;
  }

  const cart = await Cart.findOne({ userId: req.user.id });
  sendSuccess(res, 200, "Cart fetched successfully", {
    cart: cart || { userId: req.user.id, items: [], subtotal: 0, shippingFee: 0, tax: 0, total: 0 }
  });
});

export const syncCart = asyncHandler(async (req, res) => {
  const totals = computeTotals(req.body.items || [], req.body.coupon);
  if (isOrderFallbackMode()) {
    const cart = {
      userId: req.user.id,
      items: req.body.items || [],
      coupon: req.body.coupon || null,
      ...totals
    };
    fallbackCarts.set(req.user.id, cart);
    sendSuccess(res, 200, "Cart synced successfully", { cart });
    return;
  }

  const cart = await Cart.findOneAndUpdate(
    { userId: req.user.id },
    {
      userId: req.user.id,
      items: req.body.items || [],
      coupon: req.body.coupon || null,
      ...totals
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );

  sendSuccess(res, 200, "Cart synced successfully", { cart });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const items = req.body.items || [];
  if (!items.length) {
    throw new ApiError(400, "Payment order must contain at least one item");
  }

  const { keyId, keySecret } = getRazorpayConfig();
  const totals = computeTotals(items, req.body.coupon);
  const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const receipt = `lx_${Date.now()}`;

  let razorpayOrder;
  try {
    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: Math.round(totals.total * 100),
        currency: "INR",
        receipt,
        notes: {
          source: "luxeva",
          itemCount: String(items.length),
          userId: String(req.user.id || ""),
          email: String(req.user.email || "")
        }
      },
      {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    razorpayOrder = response.data;
  } catch (error) {
    console.error("Razorpay order creation failed", error.response?.data || error.message || error);
    throw new ApiError(
      error.response?.status || 502,
      error.response?.data?.error?.description || "Unable to create Razorpay order"
    );
  }

  sendSuccess(res, 200, "Razorpay order created", {
    keyId,
    order: razorpayOrder,
    totals
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  try {
    verifyRazorpaySignature(req.body);
  } catch (error) {
    console.error("Razorpay payment verification failed", {
      message: error.message,
      payload: req.body
    });
    throw error;
  }

  sendSuccess(res, 200, "Razorpay payment verified", {
    verified: true,
    paymentId: req.body.razorpay_payment_id
  });
});

const defaultStatusNotes = {
  placed: "Order placed successfully",
  packed: "Order packed and prepared for shipment",
  shipped: "Package handed over to courier and in transit",
  out_for_delivery: "Package is out for delivery",
  delivered: "Package delivered successfully",
  cancelled: "Order cancelled — any deducted amount will be refunded to your original payment method"
};

const getMilestoneNotification = (order, status, customNote) => {
  const statusKey = String(status || order.status || "").toLowerCase().replace(/-/g, "_");
  const templates = {
    placed: {
      title: `Order Placed: #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} has been placed successfully and is being prepared.`
    },
    packed: {
      title: `Order Packed: #${order.orderNumber}`,
      message: `Your package for order #${order.orderNumber} is packed and ready for dispatch.`
    },
    shipped: {
      title: `Order Shipped: #${order.orderNumber}`,
      message: `Your package for order #${order.orderNumber} is on the way.`
    },
    out_for_delivery: {
      title: `Out for Delivery: #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} is out for delivery and will reach you shortly.`
    },
    delivered: {
      title: `Order Delivered: #${order.orderNumber}`,
      message: `Your package for order #${order.orderNumber} has been delivered successfully. Thank you for shopping with Luxeva!`
    },
    cancelled: {
      title: `Order Cancelled: #${order.orderNumber}`,
      message: `Order #${order.orderNumber} was cancelled. Any deducted amount will be refunded to your original payment method.`
    }
  };

  const template = templates[statusKey] || {
    title: `Order Update: #${order.orderNumber}`,
    message: customNote || `Your order status has been updated to "${statusKey.replace(/_/g, " ")}".`
  };

  return {
    _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: String(order.userId),
    type: "order_milestone",
    milestone: statusKey,
    title: template.title,
    message: template.message,
    link: `/dashboard?tab=orders&highlight=${order._id}`,
    metadata: {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: statusKey
    },
    read: false,
    createdAt: new Date().toISOString()
  };
};

const dispatchMilestoneNotification = async (order, milestoneNotification) => {
  emitOrderUpdate(order, milestoneNotification);

  try {
    const notifBase = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";
    await axios.post(`${notifBase}/api/notifications`, {
      userId: order.userId,
      type: milestoneNotification.type,
      title: milestoneNotification.title,
      message: milestoneNotification.message,
      link: milestoneNotification.link,
      metadata: milestoneNotification.metadata
    });
  } catch {}
};

const resolveCustomerInfo = async (req) => {
  const bodyCustomer = req.body?.customer || {};
  const shippingAddress = req.body?.shippingAddress || {};
  const billingAddress = req.body?.billingAddress || {};
  const reqUser = req.user || {};

  const isValidName = (val) => {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return lower !== "user" && lower !== "guest" && lower !== "customer" && lower !== "admin";
  };

  let name = "";
  let email = bodyCustomer.email || reqUser.email || "";

  if (isValidName(bodyCustomer.name)) {
    name = bodyCustomer.name.trim();
  } else if (isValidName(shippingAddress.fullName)) {
    name = shippingAddress.fullName.trim();
  } else if (isValidName(billingAddress.fullName)) {
    name = billingAddress.fullName.trim();
  } else if (isValidName(reqUser.name)) {
    name = reqUser.name.trim();
  }

  if (!name && mongoose?.connection?.readyState === 1 && reqUser.id) {
    try {
      const authDb = mongoose.connection.useDb("auth_db", { useCache: true });
      const dbUser = await authDb.collection("users").findOne({
        $or: [{ clerkUserId: reqUser.id }, { _id: reqUser.id }]
      });
      if (dbUser && isValidName(dbUser.name)) {
        name = dbUser.name.trim();
      }
      if (!email && dbUser?.email) {
        email = dbUser.email;
      }
    } catch {}
  }

  if (!name && email && email.includes("@")) {
    const raw = email.split("@")[0].replace(/[._-]/g, " ");
    name = raw
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return {
    name: name || shippingAddress.fullName?.trim() || reqUser.name || "Customer",
    email
  };
};

const invalidateCatalogCache = async () => {
  try {
    const redis = getRedis();
    const keys = await redis.keys("catalog:*");
    if (keys.length) {
      await redis.del(keys);
    }
  } catch (err) {
    console.warn("Could not invalidate catalog cache:", err.message);
  }
};

const verifyItemsStock = async (items = []) => {
  if (mongoose.connection?.readyState !== 1) return;

  const catalogDb = mongoose.connection.useDb("catalog_db", { useCache: true });
  for (const item of items) {
    if (!item.productId) continue;
    const filter = mongoose.Types.ObjectId.isValid(item.productId)
      ? { _id: new mongoose.Types.ObjectId(item.productId) }
      : { _id: item.productId };

    const product = await catalogDb.collection("products").findOne(filter);
    if (!product) continue;

    const availableStock = Number(product.stock !== undefined ? product.stock : 0);
    if (availableStock <= 0) {
      throw new ApiError(400, `"${product.name}" is currently out of stock`);
    }

    if (item.quantity > availableStock) {
      throw new ApiError(
        400,
        `Insufficient stock for "${product.name}". Only ${availableStock} left in stock.`
      );
    }

    if ((item.size || item.color) && Array.isArray(product.variants) && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        const sizeMatch = !item.size || String(v.size || "").toLowerCase() === String(item.size).toLowerCase();
        const colorMatch = !item.color || String(v.color || "").toLowerCase() === String(item.color).toLowerCase();
        return sizeMatch && colorMatch;
      });

      if (variant && variant.stock !== undefined) {
        const variantStock = Number(variant.stock);
        if (variantStock <= 0) {
          throw new ApiError(
            400,
            `"${product.name}" (${[item.color, item.size].filter(Boolean).join(" / ")}) is currently out of stock`
          );
        }
        if (item.quantity > variantStock) {
          throw new ApiError(
            400,
            `Insufficient stock for "${product.name}" (${[item.color, item.size].filter(Boolean).join(" / ")}). Only ${variantStock} left in stock.`
          );
        }
      }
    }
  }
};

const deductItemsStock = async (items = []) => {
  if (mongoose.connection?.readyState !== 1) return;

  try {
    const catalogDb = mongoose.connection.useDb("catalog_db", { useCache: true });

    for (const item of items) {
      if (!item.productId) continue;
      const filter = mongoose.Types.ObjectId.isValid(item.productId)
        ? { _id: new mongoose.Types.ObjectId(item.productId) }
        : { _id: item.productId };

      await catalogDb.collection("products").updateOne(filter, {
        $inc: {
          stock: -item.quantity,
          soldCount: item.quantity
        }
      });

      await catalogDb.collection("products").updateOne(
        { ...filter, stock: { $lt: 0 } },
        { $set: { stock: 0 } }
      );

      if (item.size || item.color) {
        const variantElemMatch = {};
        if (item.size) variantElemMatch.size = item.size;
        if (item.color) variantElemMatch.color = item.color;

        await catalogDb.collection("products").updateOne(
          { ...filter, variants: { $elemMatch: variantElemMatch } },
          {
            $inc: {
              "variants.$.stock": -item.quantity
            }
          }
        );

        await catalogDb.collection("products").updateOne(
          { ...filter, "variants.stock": { $lt: 0 } },
          { $set: { "variants.$.stock": 0 } }
        );
      }
    }

    await invalidateCatalogCache();
  } catch (err) {
    console.error("Failed to deduct product stock:", err.message);
  }
};

const restoreItemsStock = async (items = []) => {
  if (mongoose.connection?.readyState !== 1) return;

  try {
    const catalogDb = mongoose.connection.useDb("catalog_db", { useCache: true });

    for (const item of items) {
      if (!item.productId) continue;
      const filter = mongoose.Types.ObjectId.isValid(item.productId)
        ? { _id: new mongoose.Types.ObjectId(item.productId) }
        : { _id: item.productId };

      await catalogDb.collection("products").updateOne(filter, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity
        }
      });

      await catalogDb.collection("products").updateOne(
        { ...filter, soldCount: { $lt: 0 } },
        { $set: { soldCount: 0 } }
      );

      if (item.size || item.color) {
        const variantElemMatch = {};
        if (item.size) variantElemMatch.size = item.size;
        if (item.color) variantElemMatch.color = item.color;

        await catalogDb.collection("products").updateOne(
          { ...filter, variants: { $elemMatch: variantElemMatch } },
          {
            $inc: {
              "variants.$.stock": item.quantity
            }
          }
        );
      }
    }

    await invalidateCatalogCache();
  } catch (err) {
    console.error("Failed to restore product stock:", err.message);
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const items = (req.body.items || []).map(normalizeOrderItem);
  if (!items.length) {
    throw new ApiError(400, "Order must contain at least one item");
  }

  await verifyItemsStock(items);

  const totals = computeTotals(items, req.body.coupon);
  const paymentMethod = req.body.paymentMethod || "card";

  if (razorpayManagedMethods.has(paymentMethod)) {
    verifyRazorpaySignature(req.body.razorpay || {});
  }

  const customer = await resolveCustomerInfo(req);

  if (isOrderFallbackMode()) {
    const order = {
      _id: `order-${Date.now()}`,
      orderNumber: createOrderNumber(),
      userId: req.user.id,
      customer: {
        name: customer.name,
        email: customer.email
      },
      items,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || req.body.shippingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "paid",
        transactionId: razorpayManagedMethods.has(paymentMethod) ? req.body.razorpay?.razorpay_payment_id : req.body.transactionId
      },
      timeline: [
        {
          status: "placed",
          note: "Order placed successfully"
        }
      ],
      status: "placed",
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      tax: totals.tax,
      total: totals.total,
      couponCode: req.body.coupon?.code,
      notes: req.body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fallbackOrders.unshift(order);
    fallbackCarts.set(req.user.id, {
      userId: req.user.id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      tax: 0,
      total: 0,
      coupon: null
    });

    await deductItemsStock(items);

    const milestoneNotification = getMilestoneNotification(order, "placed");
    await dispatchMilestoneNotification(order, milestoneNotification);

    sendSuccess(res, 201, "Order placed successfully", { order });
    return;
  }

  const order = await Order.create({
    orderNumber: createOrderNumber(),
    userId: req.user.id,
    customer: {
      name: customer.name,
      email: customer.email
    },
    items,
    shippingAddress: req.body.shippingAddress,
    billingAddress: req.body.billingAddress || req.body.shippingAddress,
    payment: {
      method: paymentMethod,
      status: paymentMethod === "cod" ? "pending" : "paid",
      transactionId: razorpayManagedMethods.has(paymentMethod) ? req.body.razorpay?.razorpay_payment_id : req.body.transactionId
    },
    timeline: [
      {
        status: "placed",
        note: "Order placed successfully"
      }
    ],
    subtotal: totals.subtotal,
    discount: totals.discount,
    shippingFee: totals.shippingFee,
    tax: totals.tax,
    total: totals.total,
    couponCode: req.body.coupon?.code,
    notes: req.body.notes
  });

  await Cart.findOneAndUpdate(
    { userId: req.user.id },
    { items: [], subtotal: 0, tax: 0, shippingFee: 0, total: 0, coupon: null }
  );

  await deductItemsStock(items);

  const milestoneNotification = getMilestoneNotification(order, "placed");
  await dispatchMilestoneNotification(order, milestoneNotification);

  await publishEvent("orders.events", {
    type: "order.created",
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    userId: String(order.userId),
    customerName: order.customer.name,
    total: order.total
  });

  sendSuccess(res, 201, "Order placed successfully", { order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  if (isOrderFallbackMode()) {
    const orders = fallbackOrders.filter((order) => order.userId === req.user.id);
    sendSuccess(res, 200, "Orders fetched successfully", { orders });
    return;
  }

  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Orders fetched successfully", { orders });
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  if (isOrderFallbackMode()) {
    const order = fallbackOrders.find((entry) => entry._id === req.params.id && entry.userId === req.user.id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    sendSuccess(res, 200, "Order fetched successfully", {
      order,
      invoiceHtml: `<h1>Invoice ${order.orderNumber}</h1><p>Total: Rs ${order.total}</p>`
    });
    return;
  }

  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  sendSuccess(res, 200, "Order fetched successfully", {
    order,
    invoiceHtml: `<h1>Invoice ${order.orderNumber}</h1><p>Total: $${order.total}</p>`
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const enrichOrderCustomer = (order, dbUser = null) => {
    let customerName = order.customer?.name?.trim();
    const isGeneric = !customerName || ["user", "guest", "customer", "admin"].includes(customerName.toLowerCase());

    if (isGeneric) {
      if (order.shippingAddress?.fullName?.trim() && !["user", "guest", "customer"].includes(order.shippingAddress.fullName.trim().toLowerCase())) {
        customerName = order.shippingAddress.fullName.trim();
      } else if (dbUser?.name?.trim() && !["user", "guest", "customer"].includes(dbUser.name.trim().toLowerCase())) {
        customerName = dbUser.name.trim();
      } else if (order.billingAddress?.fullName?.trim() && !["user", "guest", "customer"].includes(order.billingAddress.fullName.trim().toLowerCase())) {
        customerName = order.billingAddress.fullName.trim();
      } else if (order.customer?.email || dbUser?.email) {
        const email = order.customer?.email || dbUser?.email;
        const prefix = email.split("@")[0].replace(/[._-]/g, " ");
        customerName = prefix
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      } else {
        customerName = "Customer";
      }
    }

    const customerEmail = order.customer?.email || dbUser?.email || "";

    return {
      ...order,
      customer: {
        ...order.customer,
        name: customerName,
        email: customerEmail
      }
    };
  };

  if (isOrderFallbackMode()) {
    const orders = fallbackOrders.map((o) => enrichOrderCustomer(o));
    sendSuccess(res, 200, "Admin orders fetched successfully", { orders });
    return;
  }

  const rawOrders = await Order.find().sort({ createdAt: -1 }).lean();

  const userMap = new Map();
  if (mongoose.connection?.readyState === 1) {
    try {
      const authDb = mongoose.connection.useDb("auth_db", { useCache: true });
      const userIds = [...new Set(rawOrders.map((o) => o.userId).filter(Boolean))];
      if (userIds.length) {
        const users = await authDb
          .collection("users")
          .find({
            $or: [{ clerkUserId: { $in: userIds } }, { _id: { $in: userIds } }]
          })
          .toArray();
        users.forEach((u) => {
          if (u.clerkUserId) userMap.set(String(u.clerkUserId), u);
          if (u._id) userMap.set(String(u._id), u);
        });
      }
    } catch (err) {
      console.warn("Could not query auth_db users for admin orders enrichment:", err.message);
    }
  }

  const orders = rawOrders.map((order) => {
    const dbUser = order.userId ? userMap.get(String(order.userId)) : null;
    return enrichOrderCustomer(order, dbUser);
  });

  sendSuccess(res, 200, "Admin orders fetched successfully", { orders });
});

const PROGRESSION = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];

const adjustTimelineForStatus = (existingTimeline = [], newStatus, cleanNote, location = "") => {
  const targetKey = String(newStatus || "").toLowerCase().replace(/-/g, "_");
  const targetIdx = PROGRESSION.indexOf(targetKey);

  // If newStatus is cancelled:
  if (targetKey === "cancelled") {
    // Remove any premature delivered entries
    const filtered = (existingTimeline || []).filter((t) => {
      const s = String(t.status || "").toLowerCase().replace(/-/g, "_");
      return s !== "delivered" && s !== "cancelled";
    });
    filtered.push({
      status: "cancelled",
      note: cleanNote,
      location: location || "",
      at: new Date()
    });
    return filtered;
  }

  // If newStatus is a standard progression milestone:
  if (targetIdx >= 0) {
    // 1. Remove all timeline events whose milestone stage is strictly AFTER targetIdx
    // e.g. If targetIdx is 'shipped' (2), remove 'out_for_delivery' (3) and 'delivered' (4)
    // Also remove 'cancelled' since order is actively in progress
    let filtered = (existingTimeline || []).filter((t) => {
      const s = String(t.status || "").toLowerCase().replace(/-/g, "_");
      if (s === "cancelled") return false;
      const idx = PROGRESSION.indexOf(s);
      if (idx > targetIdx) {
        return false; // Remove future milestones (e.g. accidental delivered)
      }
      return true;
    });

    // 2. Check if target milestone already exists in the filtered timeline
    const existingTargetIdx = filtered.findIndex((t) => {
      return String(t.status || "").toLowerCase().replace(/-/g, "_") === targetKey;
    });

    if (existingTargetIdx >= 0) {
      // It already reached this stage earlier. Update note/location and truncate any trailing items.
      filtered[existingTargetIdx] = {
        ...filtered[existingTargetIdx],
        note: cleanNote || filtered[existingTargetIdx].note,
        location: location || filtered[existingTargetIdx].location || "",
        at: new Date()
      };
      filtered = filtered.slice(0, existingTargetIdx + 1);
    } else {
      // It's a new milestone reached moving forward
      filtered.push({
        status: targetKey,
        note: cleanNote,
        location: location || "",
        at: new Date()
      });
    }

    return filtered;
  }

  // Fallback
  return [
    ...(existingTimeline || []),
    {
      status: targetKey,
      note: cleanNote,
      location: location || "",
      at: new Date()
    }
  ];
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, location, carrier, trackingNumber, trackingUrl, estimatedDelivery } = req.body || {};

  const statusKey = String(status || "").toLowerCase().replace("-", "_");
  const cleanNote = note && !note.toLowerCase().includes("by admin")
    ? note
    : (defaultStatusNotes[statusKey] || `Package is currently ${statusKey.replace(/_/g, " ")}`);

  if (isOrderFallbackMode()) {
    const order = fallbackOrders.find((entry) => entry._id === req.params.id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const prevStatus = order.status;
    if (status) order.status = status;
    order.updatedAt = new Date().toISOString();
    order.timeline = adjustTimelineForStatus(order.timeline || [], status || order.status, cleanNote, location || "");

    const newStatusKey = String(status || order.status).toLowerCase().replace(/-/g, "_");
    const nextEstimatedDelivery = newStatusKey === "delivered"
      ? null
      : estimatedDelivery !== undefined
      ? estimatedDelivery
      : order.shipping?.estimatedDelivery;

    order.shipping = {
      ...order.shipping,
      ...(carrier !== undefined ? { carrier } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber } : {}),
      ...(trackingUrl !== undefined ? { trackingUrl } : {}),
      estimatedDelivery: nextEstimatedDelivery
    };

    if (prevStatus !== "cancelled" && newStatusKey === "cancelled") {
      await restoreItemsStock(order.items);
    } else if (prevStatus === "cancelled" && newStatusKey !== "cancelled") {
      await deductItemsStock(order.items);
    }

    const milestoneNotification = getMilestoneNotification(order, status || order.status, cleanNote);
    await dispatchMilestoneNotification(order, milestoneNotification);

    sendSuccess(res, 200, "Order status updated successfully", { order });
    return;
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const prevStatus = order.status;
  if (status) order.status = status;
  order.timeline = adjustTimelineForStatus(order.timeline || [], status || order.status, cleanNote, location || "");

  const newStatusKey = String(status || order.status).toLowerCase().replace(/-/g, "_");
  const nextEstimatedDelivery = newStatusKey === "delivered"
    ? null
    : estimatedDelivery !== undefined
    ? estimatedDelivery
    : order.shipping?.estimatedDelivery;

  order.shipping = {
    carrier: carrier !== undefined ? carrier : order.shipping?.carrier,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : order.shipping?.trackingNumber,
    trackingUrl: trackingUrl !== undefined ? trackingUrl : order.shipping?.trackingUrl,
    estimatedDelivery: nextEstimatedDelivery
  };

  await order.save();

  if (prevStatus !== "cancelled" && newStatusKey === "cancelled") {
    await restoreItemsStock(order.items);
  } else if (prevStatus === "cancelled" && newStatusKey !== "cancelled") {
    await deductItemsStock(order.items);
  }

  const milestoneNotification = getMilestoneNotification(order, status || order.status, cleanNote);
  await dispatchMilestoneNotification(order, milestoneNotification);

  await publishEvent("orders.events", {
    type: "order.updated",
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    userId: String(order.userId),
    status: order.status
  });

  sendSuccess(res, 200, "Order status updated successfully", { order });
});

const buildMonthlySalesSeries = (orderList = []) => {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      sales: 0,
      profit: 0,
      orders: 0
    });
  }

  (orderList || []).forEach((order) => {
    if (order.status === "cancelled") return;
    const d = new Date(order.createdAt || Date.now());
    const m = d.toLocaleString("en-US", { month: "short" });
    const y = d.getFullYear();
    const entry = result.find((item) => item.month === m && item.year === y);
    if (entry) {
      entry.sales = Number((entry.sales + (order.total || 0)).toFixed(2));
      entry.profit = Number((entry.sales * 0.38).toFixed(2));
      entry.orders += 1;
    }
  });

  return result.map(({ month, sales, profit, orders }) => ({ month, sales, profit, orders }));
};

export const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query || {};

  if (isOrderFallbackMode()) {
    let orderPool = fallbackOrders;
    if (startDate || endDate) {
      const startMs = startDate ? new Date(startDate).getTime() : 0;
      const endMs = endDate ? new Date(endDate).getTime() : Infinity;
      orderPool = fallbackOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    const validOrders = orderPool.filter((o) => o.status !== "cancelled");
    const cancelledOrdersList = orderPool.filter((o) => o.status === "cancelled");
    const revenue = Number(validOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2));
    const estimatedProfit = Number((revenue * 0.38).toFixed(2));
    const lostRevenue = Number(cancelledOrdersList.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2));
    const cancellationRate = orderPool.length
      ? Number(((cancelledOrdersList.length / orderPool.length) * 100).toFixed(1))
      : 0;

    const statusBreakdown = orderPool.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    const activeOrders = orderPool.filter((o) =>
      ["placed", "packed", "shipped", "out_for_delivery"].includes(o.status)
    ).length;
    const deliveredOrders = orderPool.filter((o) => o.status === "delivered").length;
    const cancelledOrders = cancelledOrdersList.length;
    const monthlySales = buildMonthlySalesSeries(orderPool);

    sendSuccess(res, 200, "Analytics fetched successfully", {
      analytics: {
        revenue,
        estimatedProfit,
        orders: orderPool.length,
        activeOrders,
        deliveredOrders,
        cancelledOrders,
        cancellationRate,
        lostRevenue,
        averageOrderValue: validOrders.length ? Number((revenue / validOrders.length).toFixed(2)) : 0,
        statusBreakdown,
        monthlySales
      }
    });
    return;
  }

  const query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const matchValid = { status: { $ne: "cancelled" } };
  if (startDate || endDate) {
    matchValid.createdAt = query.createdAt;
  }

  const [orders, revenueAgg] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }),
    Order.aggregate([
      {
        $match: matchValid
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      }
    ])
  ]);

  const current = revenueAgg[0] || { revenue: 0, orders: 0 };
  const validOrdersCount = current.orders || 0;
  const totalRevenue = Number((current.revenue || 0).toFixed(2));
  const estimatedProfit = Number((totalRevenue * 0.38).toFixed(2));

  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const activeOrders = orders.filter((o) =>
    ["placed", "packed", "shipped", "out_for_delivery"].includes(o.status)
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrdersList = orders.filter((o) => o.status === "cancelled");
  const cancelledOrders = cancelledOrdersList.length;
  const lostRevenue = Number(cancelledOrdersList.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));
  const cancellationRate = orders.length
    ? Number(((cancelledOrders / orders.length) * 100).toFixed(1))
    : 0;
  const monthlySales = buildMonthlySalesSeries(orders);

  sendSuccess(res, 200, "Analytics fetched successfully", {
    analytics: {
      revenue: totalRevenue,
      estimatedProfit,
      orders: orders.length,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
      cancellationRate,
      lostRevenue,
      averageOrderValue: validOrdersCount ? Number((totalRevenue / validOrdersCount).toFixed(2)) : 0,
      statusBreakdown,
      monthlySales
    }
  });
});

// ── Smart Returns & Refunds Controllers ──────────────────────────────────────

export const requestReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, detailedReason, items, evidence, preferredResolution, upiId } = req.body;

  let order = null;
  if (mongoose.connection.readyState === 1) {
    order = await Order.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orderNumber: id }]
    });
  }

  // Fallback memory order
  if (!order) {
    order = fallbackOrders.find((o) => o._id === id || o.orderNumber === id);
  }

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "delivered") {
    throw new ApiError(400, "Returns can only be requested for delivered orders.");
  }

  const returnId = `RET-LX-${Math.floor(100000 + Math.random() * 900000)}`;
  const returnItems = Array.isArray(items) && items.length > 0 ? items : order.items || [];
  const refundAmount = returnItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const newReturnRequest = {
    returnId,
    status: "requested",
    reason: reason || "Defective / Quality Issue",
    detailedReason: detailedReason || "",
    items: returnItems,
    evidence: Array.isArray(evidence) ? evidence : [],
    preferredResolution: preferredResolution || "refund_original",
    upiId: upiId || "",
    refundAmount: refundAmount || order.total,
    requestedAt: new Date(),
    timeline: [
      {
        status: "requested",
        title: "Return Request Submitted",
        note: "Customer initiated return request with uploaded details. Pending quality team review.",
        at: new Date()
      }
    ]
  };

  order.returnRequest = newReturnRequest;

  if (order.save) {
    await order.save();
  }

  try {
    emitOrderUpdate(order.orderNumber, order);
  } catch (e) {}

  sendSuccess(res, 200, "Return request submitted successfully. Our team will review within 24 hours.", {
    order,
    returnRequest: order.returnRequest
  });
});

export const getReturnDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let order = null;
  if (mongoose.connection.readyState === 1) {
    order = await Order.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orderNumber: id }]
    });
  }
  if (!order) {
    order = fallbackOrders.find((o) => o._id === id || o.orderNumber === id);
  }
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  sendSuccess(res, 200, "Return details fetched", {
    returnRequest: order.returnRequest || { status: "none" },
    order
  });
});

export const getAllReturns = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let returns = [];

  if (mongoose.connection.readyState === 1) {
    const query = { "returnRequest.status": { $exists: true, $nin: ["none", null] } };
    if (status && status !== "all") {
      query["returnRequest.status"] = status;
    }
    const orders = await Order.find(query).sort({ "returnRequest.requestedAt": -1 });
    returns = orders.map((o) => ({
      ...o.toObject(),
      returnRequest: o.returnRequest
    }));
  }

  // Fallback
  if (!returns.length) {
    returns = fallbackOrders
      .filter((o) => o.returnRequest && o.returnRequest.status && o.returnRequest.status !== "none")
      .filter((o) => (!status || status === "all" ? true : o.returnRequest.status === status));
  }

  sendSuccess(res, 200, "Returns fetched successfully", { returns });
});

export const reviewReturnDecision = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    decision,
    rationale,
    pickupDate,
    pickupCarrier,
    pickupTrackingNumber,
    refundTransactionId,
    refundMethod,
    notes
  } = req.body;

  let order = null;
  if (mongoose.connection.readyState === 1) {
    order = await Order.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { orderNumber: id }]
    });
  }
  if (!order) {
    order = fallbackOrders.find((o) => o._id === id || o.orderNumber === id);
  }
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!order.returnRequest || order.returnRequest.status === "none") {
    throw new ApiError(400, "No return request exists for this order");
  }

  order.returnRequest.status = decision;
  order.returnRequest.reviewedAt = new Date();
  order.returnRequest.reviewedBy = req.user?.email || "Admin Operations";

  if (!order.returnRequest.adminDecision) {
    order.returnRequest.adminDecision = {};
  }

  order.returnRequest.adminDecision = {
    ...order.returnRequest.adminDecision,
    status: decision,
    rationale: rationale || order.returnRequest.adminDecision.rationale || "",
    decisionDate: new Date(),
    pickupDate: pickupDate || order.returnRequest.adminDecision.pickupDate,
    pickupCarrier: pickupCarrier || order.returnRequest.adminDecision.pickupCarrier,
    pickupTrackingNumber: pickupTrackingNumber || order.returnRequest.adminDecision.pickupTrackingNumber,
    refundTransactionId: refundTransactionId || order.returnRequest.adminDecision.refundTransactionId,
    refundMethod: refundMethod || order.returnRequest.adminDecision.refundMethod,
    notes: notes || order.returnRequest.adminDecision.notes || ""
  };

  let milestoneTitle = "Return Status Updated";
  let milestoneNote = notes || rationale || "";

  if (decision === "approved") {
    milestoneTitle = "Return Approved & Pickup Scheduled";
    milestoneNote = notes || `Return authorized. Reverse pickup assigned to ${pickupCarrier || "Courier Partner"}${pickupTrackingNumber ? ` (Tracking: ${pickupTrackingNumber})` : ""}.`;
  } else if (decision === "picked_up") {
    milestoneTitle = "Item Collected by Logistics";
    milestoneNote = notes || `Reverse pickup completed. Package en route to central return hub.`;
  } else if (decision === "inspected") {
    milestoneTitle = "Warehouse Inspection Passed";
    milestoneNote = notes || `Item tags and physical condition inspected successfully. Approved for refund.`;
  } else if (decision === "refunded") {
    milestoneTitle = "Refund Issued & Completed";
    milestoneNote = notes || `Refund credited to ${refundMethod || "Original Payment Method"}. Bank Ref: ${refundTransactionId || "REF-" + Math.floor(100000 + Math.random() * 900000)}`;
  } else if (decision === "rejected") {
    milestoneTitle = "Return Request Rejected";
    milestoneNote = rationale || "Return request rejected as per policy guidelines.";
  }

  if (!order.returnRequest.timeline) {
    order.returnRequest.timeline = [];
  }

  order.returnRequest.timeline.push({
    status: decision,
    title: milestoneTitle,
    note: milestoneNote,
    at: new Date()
  });

  if (order.save) {
    await order.save();
  }

  try {
    emitOrderUpdate(order.orderNumber, order);
  } catch (e) {}

  sendSuccess(res, 200, `Return decision recorded: ${decision.toUpperCase()}`, { order });
});
