import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: String,
    avatar: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    defaultAddressId: {
      type: mongoose.Schema.Types.Mixed,
      ref: "Address"
    },
    wishlistProductIds: [
      {
        type: mongoose.Schema.Types.Mixed
      }
    ],
    recentlyViewed: [
      {
        type: mongoose.Schema.Types.Mixed
      }
    ]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
