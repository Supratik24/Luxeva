
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      unique: true,
      sparse: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: "INR"
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);