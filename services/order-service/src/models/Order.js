import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    slug: String,
    image: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    color: String,
    size: String
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    location: String,
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const returnTimelineSchema = new mongoose.Schema(
  {
    status: String,
    title: String,
    note: String,
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: { type: String },
    requestType: {
      type: String,
      enum: ["return", "replacement"],
      default: "return"
    },
    status: {
      type: String,
      enum: [
        "none",
        "requested",
        "approved",
        "picked_up",
        "inspected",
        "refunded",
        "replacement_dispatched",
        "replaced",
        "rejected"
      ],
      default: "none"
    },
    reason: String,
    detailedReason: String,
    items: [
      {
        productId: mongoose.Schema.Types.Mixed,
        name: String,
        price: Number,
        quantity: Number,
        image: String
      }
    ],
    evidence: [{ url: String, name: String }],
    preferredResolution: {
      type: String,
      enum: ["refund_original", "store_credit", "exchange"],
      default: "refund_original"
    },
    replacementDetails: {
      exchangeType: { type: String, enum: ["size", "color", "defective_swap", "other"], default: "size" },
      requestedSize: String,
      requestedColor: String,
      replacementItemName: String,
      replacementCarrier: String,
      replacementTrackingNumber: String,
      replacementDispatchedAt: Date,
      replacementEstimatedDelivery: Date,
      customerNotes: String
    },
    upiId: String,
    refundAmount: Number,
    requestedAt: Date,
    reviewedAt: Date,
    reviewedBy: String,
    adminDecision: {
      status: String,
      rationale: String,
      decisionDate: Date,
      refundTransactionId: String,
      refundMethod: String,
      pickupDate: Date,
      pickupCarrier: String,
      pickupTrackingNumber: String,
      replacementCarrier: String,
      replacementTrackingNumber: String,
      replacementDispatchedAt: Date,
      replacementEstimatedDelivery: Date,
      notes: String
    },
    timeline: [returnTimelineSchema]
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    customer: {
      name: String,
      email: String
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    payment: {
      method: { type: String, enum: ["card", "cod", "razorpay", "netbanking", "wallet", "paylater", "luxeva_wallet"], default: "card" },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      transactionId: String,
      walletAmountUsed: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ["placed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "placed"
    },
    shipping: {
      carrier: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
      estimatedDelivery: { type: Date }
    },
    timeline: [timelineSchema],
    subtotal: Number,
    discount: Number,
    shippingFee: Number,
    tax: Number,
    total: Number,
    couponCode: String,
    walletAmountUsed: { type: Number, default: 0 },
    notes: String,
    returnRequest: { type: returnRequestSchema, default: () => ({ status: "none" }) }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
