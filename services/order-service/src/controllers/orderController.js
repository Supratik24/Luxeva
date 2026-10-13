import crypto from "crypto";
import axios from "axios";
import mongoose from "mongoose";
import {
  ApiError,
  asyncHandler,
  publishEvent,
  sendSuccess
} from "@luxeva/shared";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { emitOrderUpdate } from "../socket.js";

const fallbackCarts = new Map();
const fallbackOrders = [];
const razorpayManagedMethods = new Set(["razorpay", "netbanking", "wallet", "paylater"]);

const isOrderFallbackMode = () => process.env.ORDER_FALLBACK_MODE === "memory";
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

export const createOrder = asyncHandler(async (req, res) => {
  const items = (req.body.items || []).map(normalizeOrderItem);
  if (!items.length) {
    throw new ApiError(400, "Order must contain at least one item");
  }

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

    const milestoneNotification = getMilestoneNotification(order, status || order.status, cleanNote);
    await dispatchMilestoneNotification(order, milestoneNotification);

    sendSuccess(res, 200, "Order status updated successfully", { order });
    return;
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

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

export const getAnalytics = asyncHandler(async (req, res) => {
  if (isOrderFallbackMode()) {
    const revenue = fallbackOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const statusBreakdown = fallbackOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    const monthlySales = fallbackOrders.reduce((acc, order) => {
      const key = new Date(order.createdAt).toLocaleString("en-US", { month: "short" });
      const existing = acc.find((entry) => entry.month === key);
      if (existing) {
        existing.sales += order.total;
      } else {
        acc.push({ month: key, sales: order.total });
      }
      return acc;
    }, []);

    sendSuccess(res, 200, "Analytics fetched successfully", {
      analytics: {
        revenue,
        orders: fallbackOrders.length,
        averageOrderValue: fallbackOrders.length ? Number((revenue / fallbackOrders.length).toFixed(2)) : 0,
        statusBreakdown,
        monthlySales
      }
    });
    return;
  }

  const [orders, revenueAgg] = await Promise.all([
    Order.find().sort({ createdAt: -1 }),
    Order.aggregate([
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
  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const monthlySales = orders.reduce((acc, order) => {
    const key = new Date(order.createdAt).toLocaleString("en-US", {
      month: "short"
    });
    const existing = acc.find((entry) => entry.month === key);
    if (existing) {
      existing.sales += order.total;
    } else {
      acc.push({ month: key, sales: order.total });
    }
    return acc;
  }, []);

  sendSuccess(res, 200, "Analytics fetched successfully", {
    analytics: {
      revenue: current.revenue,
      orders: current.orders,
      averageOrderValue: current.orders ? Number((current.revenue / current.orders).toFixed(2)) : 0,
      statusBreakdown,
      monthlySales
    }
  });
});
