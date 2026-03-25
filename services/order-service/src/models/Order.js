import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    customer: {
      name: String,
      email: String
    },
    items: [orderItemSchema],
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    payment: {
      method: { type: String, enum: ["card", "cod", "razorpay", "stripe"], default: "card" },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      transactionId: String
    },
    status: {
      type: String,
      enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed"
    },
    timeline: [timelineSchema],
    subtotal: Number,
    discount: Number,
    shippingFee: Number,
    tax: Number,
    total: Number,
    couponCode: String,
    notes: String
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

