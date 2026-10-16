import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed"
    },
    source: {
      type: String,
      default: "storefront_footer"
    },
    tags: {
      type: [String],
      default: ["general", "storefront"]
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
