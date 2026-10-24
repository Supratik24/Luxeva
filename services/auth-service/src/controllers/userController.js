import mongoose from "mongoose";
import { ApiError, asyncHandler, sendSuccess } from "@luxeva/shared";
import Address from "../models/Address.js";
import User from "../models/User.js";

// ── Helper: find user by Clerk ID or Mongo ID ─────────────────────────────────
const findUser = async (userId) => {
  let user = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId);
  }
  if (!user) {
    user = await User.findOne({ clerkUserId: userId });
  }
  return user;
};

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, "Users fetched successfully", { users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const addresses = await Address.find({ user: user._id });
  sendSuccess(res, 200, "User fetched successfully", { user, addresses });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      isActive: req.body.isActive
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  sendSuccess(res, 200, "User updated successfully", { user });
});

// ── Wallet Controllers ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/wallet
 * Returns wallet balance and transaction history for the current user.
 */
export const getWallet = asyncHandler(async (req, res) => {
  const userId = req.user?.clerkUserId || req.user?.id;
  const user = await findUser(userId);

  if (!user) {
    // Return empty wallet if user not in DB yet (Clerk-only user)
    return sendSuccess(res, 200, "Wallet fetched successfully", {
      wallet: { balance: 0, transactions: [] }
    });
  }

  sendSuccess(res, 200, "Wallet fetched successfully", {
    wallet: {
      balance: user.wallet?.balance || 0,
      transactions: (user.wallet?.transactions || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50) // last 50 transactions
    }
  });
});

/**
 * POST /api/auth/wallet/credit  (internal — called by order-service)
 * Expects: { userId, amount, description, reference }
 * Protected by INTERNAL_SERVICE_SECRET header.
 */
export const creditWallet = asyncHandler(async (req, res) => {
  const secret = req.headers["x-internal-service-token"];
  const expected = process.env.INTERNAL_SERVICE_SECRET || "luxeva_internal_service_secret";
  if (secret !== expected) {
    throw new ApiError(403, "Unauthorized internal request");
  }

  const { userId, amount, description, reference } = req.body;
  if (!userId || !amount || amount <= 0) {
    throw new ApiError(400, "Invalid wallet credit request");
  }

  const user = await findUser(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.wallet) {
    user.wallet = { balance: 0, transactions: [] };
  }

  const newBalance = Number(((user.wallet.balance || 0) + Number(amount)).toFixed(2));
  user.wallet.balance = newBalance;
  user.wallet.transactions.push({
    type: "credit",
    amount: Number(amount),
    description: description || "Refund credited to wallet",
    reference: reference || "",
    balanceAfter: newBalance
  });

  await user.save();

  sendSuccess(res, 200, "Wallet credited successfully", {
    wallet: { balance: user.wallet.balance }
  });
});

/**
 * POST /api/auth/wallet/debit  (internal — called by order-service at checkout)
 * Expects: { userId, amount, description, reference }
 */
export const debitWallet = asyncHandler(async (req, res) => {
  const secret = req.headers["x-internal-service-token"];
  const expected = process.env.INTERNAL_SERVICE_SECRET || "luxeva_internal_service_secret";
  if (secret !== expected) {
    throw new ApiError(403, "Unauthorized internal request");
  }

  const { userId, amount, description, reference } = req.body;
  if (!userId || !amount || amount <= 0) {
    throw new ApiError(400, "Invalid wallet debit request");
  }

  const user = await findUser(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.wallet) {
    user.wallet = { balance: 0, transactions: [] };
  }

  const currentBalance = user.wallet.balance || 0;
  if (currentBalance < Number(amount)) {
    throw new ApiError(400, `Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}`);
  }

  const newBalance = Number((currentBalance - Number(amount)).toFixed(2));
  user.wallet.balance = newBalance;
  user.wallet.transactions.push({
    type: "debit",
    amount: Number(amount),
    description: description || "Used at checkout",
    reference: reference || "",
    balanceAfter: newBalance
  });

  await user.save();

  sendSuccess(res, 200, "Wallet debited successfully", {
    wallet: { balance: user.wallet.balance, debited: Number(amount) }
  });
});

/**
 * GET /api/auth/wallet/balance  (internal — called by order-service to check balance before charging)
 */
export const getWalletBalance = asyncHandler(async (req, res) => {
  const secret = req.headers["x-internal-service-token"];
  const expected = process.env.INTERNAL_SERVICE_SECRET || "luxeva_internal_service_secret";
  if (secret !== expected) {
    throw new ApiError(403, "Unauthorized internal request");
  }

  const { userId } = req.query;
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  const user = await findUser(userId);
  const balance = user?.wallet?.balance || 0;

  sendSuccess(res, 200, "Balance fetched", { balance });
});
