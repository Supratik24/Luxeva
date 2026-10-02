
import crypto from "node:crypto";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import { getEnv } from "@luxeva/shared";

const razorpay = new Razorpay({
  key_id: getEnv("RAZORPAY_KEY_ID"),
  key_secret: getEnv("RAZORPAY_KEY_SECRET")
});

// Create a Razorpay order
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "A valid order ID and amount in paise are required."
      });
    }

    // TODO: Before production, fetch the order from Order Service
    // and derive the amount from the trusted order record.
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `order_${crypto.randomUUID()}`
    });

    const payment = await Payment.create({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: "INR",
      status: "PENDING"
    });

    return res.status(201).json({
      success: true,
      paymentId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: getEnv("RAZORPAY_KEY_ID")
    });
  } catch (error) {
    console.error("Create payment order failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create payment order."
    });
  }
};

// Verify Razorpay's payment signature
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required."
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found."
      });
    }

    if (payment.status === "SUCCESS") {
      return res.status(409).json({
        success: false,
        message: "This payment has already been verified."
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", getEnv("RAZORPAY_KEY_SECRET"))
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature."
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "SUCCESS";
    await payment.save();

    return res.json({
      success: true,
      message: "Payment signature verified.",
      paymentId: payment._id,
      status: payment.status
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify payment."
    });
  }
};