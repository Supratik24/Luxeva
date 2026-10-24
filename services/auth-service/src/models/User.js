import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    reference: String,   // orderId, returnId, transactionId etc.
    balanceAfter: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

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
    ],
    // ── Luxeva Wallet ───────────────────────────────────────
    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0
      },
      transactions: [walletTransactionSchema]
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
