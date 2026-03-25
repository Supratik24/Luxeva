import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  ApiError,
  asyncHandler,
  getRedis,
  sendSuccess,
  signToken
} from "@luxeva/shared";
import Address from "../models/Address.js";
import User from "../models/User.js";
import { sendResetOtp as sendTwoFactorResetOtp } from "../utils/twoFactor.js";

const createAuthPayload = (user) => ({
  token: signToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  }),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone
  }
});

const maybeSendResetEmail = async (email, token) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: "support@luxeva.local",
    to: email,
    subject: "Reset your Luxeva password",
    text: `Use this reset token to update your password: ${token}`
  });
};

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const maskPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};

const assertStrongPassword = (password) => {
  if (!strongPasswordRegex.test(String(password || ""))) {
    throw new ApiError(
      422,
      "Password must be 8+ characters and include uppercase, lowercase, number, and special character"
    );
  }
};

export const signup = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  assertStrongPassword(req.body.password);

  const user = await User.create({
    name,
    email,
    password: req.body.password,
    phone
  });

  sendSuccess(res, 201, "Account created successfully", createAuthPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been disabled");
  }

  sendSuccess(res, 200, "Login successful", createAuthPayload(user));
});

export const adminLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(req.body.password)) || user.role !== "admin") {
    throw new ApiError(401, "Invalid admin credentials");
  }

  sendSuccess(res, 200, "Admin login successful", createAuthPayload(user));
});

export const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    const redis = getRedis();
    await redis.set(`blacklist:${token}`, "1", "EX", 60 * 60 * 24 * 7);
  }

  sendSuccess(res, 200, "Logged out successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (!user.phone) {
    throw new ApiError(400, "This account does not have a phone number configured for OTP reset");
  }

  const otp = generateOtp();
  user.resetPasswordOtpHash = hashOtp(otp);
  user.resetPasswordOtpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);
  user.resetPasswordOtpVerifiedAt = undefined;
  await user.save();

  await sendTwoFactorResetOtp({
    phone: user.phone,
    otp
  });

  await maybeSendResetEmail(
    user.email,
    `Password reset OTP requested for your account. OTP sent to phone ending ${maskPhone(user.phone)}`
  );

  sendSuccess(res, 200, "Password reset OTP sent successfully", {
    maskedPhone: maskPhone(user.phone),
    email
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt || user.resetPasswordOtpExpiresAt < new Date()) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  if (user.resetPasswordOtpHash !== hashOtp(otp)) {
    throw new ApiError(400, "Incorrect OTP");
  }

  user.resetPasswordOtpVerifiedAt = new Date();
  await user.save();

  sendSuccess(res, 200, "OTP verified successfully");
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  assertStrongPassword(req.body.password);

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt || user.resetPasswordOtpExpiresAt < new Date()) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  if (user.resetPasswordOtpHash !== hashOtp(otp)) {
    throw new ApiError(400, "Incorrect OTP");
  }

  user.password = req.body.password;
  user.resetPasswordOtpHash = undefined;
  user.resetPasswordOtpExpiresAt = undefined;
  user.resetPasswordOtpVerifiedAt = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  sendSuccess(res, 200, "Password reset successfully");
});

export const resetPassword = asyncHandler(async (req, res) => {
  assertStrongPassword(req.body.password);
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  sendSuccess(res, 200, "Password reset successfully");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -resetPasswordToken");
  const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, 200, "Profile fetched successfully", {
    user,
    addresses
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      avatar: req.body.avatar
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password");

  sendSuccess(res, 200, "Profile updated successfully", { user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  assertStrongPassword(req.body.newPassword);
  user.password = req.body.newPassword;
  await user.save();

  sendSuccess(res, 200, "Password changed successfully");
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, 200, "Addresses fetched successfully", { addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
  }

  const address = await Address.create({
    ...req.body,
    user: req.user.id
  });

  if (address.isDefault) {
    await User.findByIdAndUpdate(req.user.id, { defaultAddressId: address._id });
  }

  sendSuccess(res, 201, "Address added successfully", { address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
  }

  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (address.isDefault) {
    await User.findByIdAndUpdate(req.user.id, { defaultAddressId: address._id });
  }

  sendSuccess(res, 200, "Address updated successfully", { address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  sendSuccess(res, 200, "Address removed successfully");
});
