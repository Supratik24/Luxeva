import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "announcement" // announcement, private_drop, flash_sale, editorial
    },
    actionUrl: {
      type: String,
      default: "/shop"
    },
    actionText: {
      type: String,
      default: "Explore Collection"
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "sent"
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
