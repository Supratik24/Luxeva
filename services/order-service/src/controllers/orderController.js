import crypto from "crypto";
import axios from "axios";
import Stripe from "stripe";
import {
  ApiError,
  asyncHandler,
  publishEvent,
  sendSuccess
} from "@luxeva/shared";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
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

export const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(500, "Stripe is not configured");
  }

  const totals = computeTotals(req.body.items || [], req.body.coupon);
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(totals.total * 100),
    currency: "usd",
    metadata: {
      userId: String(req.user.id)
    }
  });

  sendSuccess(res, 200, "Payment intent created", {
    clientSecret: intent.client_secret,
    totals
  });
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

  if (isOrderFallbackMode()) {
    const order = {
      _id: `order-${Date.now()}`,
      orderNumber: createOrderNumber(),
      userId: req.user.id,
      customer: {
        name: req.user.name,
        email: req.user.email
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

    sendSuccess(res, 201, "Order placed successfully", { order });
    return;
  }

  const order = await Order.create({
    orderNumber: createOrderNumber(),
    userId: req.user.id,
    customer: {
      name: req.user.name,
      email: req.user.email
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
  if (isOrderFallbackMode()) {
    sendSuccess(res, 200, "Admin orders fetched successfully", { orders: fallbackOrders });
    return;
  }

  const orders = await Order.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, "Admin orders fetched successfully", { orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (isOrderFallbackMode()) {
    const order = fallbackOrders.find((entry) => entry._id === req.params.id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    order.status = req.body.status;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status: req.body.status,
      note: req.body.note || `Order marked as ${req.body.status}`
    });

    sendSuccess(res, 200, "Order status updated successfully", { order });
    return;
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = req.body.status;
  order.timeline.push({
    status: req.body.status,
    note: req.body.note || `Order marked as ${req.body.status}`
  });
  await order.save();

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
