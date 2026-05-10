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
import { sendResetOtp as sendTwoFactorOtp } from "../utils/twoFactor.js";
import {
  clearFallbackDefaultAddresses,
  compareFallbackPassword,
  createFallbackAddress,
  createFallbackUser,
  deleteFallbackAddress,
  findFallbackUserByEmail,
  findFallbackUserByEmailOrGoogleId,
  findFallbackUserById,
  findFallbackUserByResetToken,
  isFallbackAuthStore,
  listFallbackAddresses,
  saveFallbackUser,
  updateFallbackAddress,
  updateFallbackUser
} from "../utils/fallbackAuthStore.js";

const createAuthPayload = (user) => ({
  token: signToken({
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    name: user.name
  }),
  user: {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone
  }
});

const maybeSendEmail = async ({ email, subject, text }) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER === "replace-me" ||
    process.env.SMTP_PASS === "replace-me"
  ) {
    return {
      sent: false,
      reason: "Email delivery is not configured on the server yet"
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 2525),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || "support@luxeva.local",
      to: email,
      subject,
      text
    });

    return {
      sent: true
    };
  } catch (error) {
    console.warn(`Reset email delivery skipped: ${error.message}`);
    return {
      sent: false,
      reason: error.message
    };
  }
};

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const maskEmail = (email = "") => {
  const [localPart = "", domain = ""] = String(email).trim().toLowerCase().split("@");
  if (!localPart || !domain) {
    return email;
  }

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(localPart.length - 2, 1))}@${domain}`;
};
const maskPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  return `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
};
const generateProviderPassword = () => `${crypto.randomBytes(16).toString("hex")}Aa!9`;
const signupOtpTtlMs = 1000 * 60 * 10;

const verifyGoogleCredential = async (credential) => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(credential || ""))}`
  );

  if (!response.ok) {
    throw new ApiError(401, "Google sign-in token is invalid or expired");
  }

  const payload = await response.json();
  const allowedAudiences = [process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID].filter(Boolean);

  if (!allowedAudiences.length) {
    throw new ApiError(503, "Google sign-in is not configured on the server");
  }

  if (!allowedAudiences.includes(payload.aud)) {
    throw new ApiError(401, "Google sign-in token audience mismatch");
  }

  if (payload.email_verified !== "true") {
    throw new ApiError(401, "Google account email could not be verified");
  }

  return payload;
};

const assertStrongPassword = (password) => {
  if (!strongPasswordRegex.test(String(password || ""))) {
    throw new ApiError(
      422,
      "Password must be 8+ characters and include uppercase, lowercase, number, and special character"
    );
  }
};

const getUserByEmail = (email) =>
  isFallbackAuthStore() ? findFallbackUserByEmail(email) : User.findOne({ email });

const getUserById = (id) =>
  isFallbackAuthStore() ? findFallbackUserById(id) : User.findById(id);

const getUserByEmailOrGoogleId = (email, googleId) =>
  isFallbackAuthStore()
    ? findFallbackUserByEmailOrGoogleId(email, googleId)
    : User.findOne({
        $or: [{ email }, { googleId }]
      });

const persistUser = (user) => (isFallbackAuthStore() ? saveFallbackUser(user) : user.save());

const createUserRecord = (payload) => (isFallbackAuthStore() ? createFallbackUser(payload) : User.create(payload));

const comparePassword = (user, password) =>
  isFallbackAuthStore() ? compareFallbackPassword(user, password) : user.comparePassword(password);

export const signup = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const otp = generateOtp();

  let user = await getUserByEmail(email);
  if (user && user.isVerified !== false) {
    throw new ApiError(409, "An account with this email already exists");
  }

  assertStrongPassword(req.body.password);

  if (user && user.role === "admin") {
    throw new ApiError(409, "An account with this email already exists");
  }

  if (!user) {
    user = isFallbackAuthStore()
      ? await createUserRecord({
          name,
          email,
          password: req.body.password,
          phone,
          isVerified: false
        })
      : new User({
          name,
          email,
          password: req.body.password,
          phone,
          isVerified: false
        });
  } else {
    user.name = name;
    user.email = email;
    user.password = req.body.password;
    user.phone = phone;
    user.isVerified = false;
  }

  user.signupOtpHash = hashOtp(otp);
  user.signupOtpExpiresAt = new Date(Date.now() + signupOtpTtlMs);
  await persistUser(user);

  const emailResult = await maybeSendEmail({
    email: user.email,
    subject: "Your Luxeva signup OTP",
    text: `Your Luxeva email verification OTP is ${otp}. It will expire in 10 minutes.`
  });

  if (!emailResult.sent) {
    throw new ApiError(503, `Signup email OTP is unavailable: ${emailResult.reason}`);
  }

  sendSuccess(res, 202, "Signup OTP sent successfully", {
    email,
    maskedEmail: maskEmail(user.email)
  });
});

export const verifySignupOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "No pending signup found for that email");
  }

  if (user.isVerified !== false) {
    throw new ApiError(409, "This account is already verified");
  }

  if (!user.signupOtpHash || !user.signupOtpExpiresAt || new Date(user.signupOtpExpiresAt) < new Date()) {
    throw new ApiError(400, "Signup OTP is invalid or expired");
  }

  if (user.signupOtpHash !== hashOtp(otp)) {
    throw new ApiError(400, "Incorrect signup OTP");
  }

  user.isVerified = true;
  user.signupOtpHash = undefined;
  user.signupOtpExpiresAt = undefined;
  await persistUser(user);

  sendSuccess(res, 200, "Account verified successfully", createAuthPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await getUserByEmail(email);
  if (!user || !(await comparePassword(user, req.body.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isVerified === false) {
    throw new ApiError(403, "Please verify your email OTP before logging in");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been disabled");
  }

  sendSuccess(res, 200, "Login successful", createAuthPayload(user));
});

export const googleLogin = asyncHandler(async (req, res) => {
  const payload = await verifyGoogleCredential(req.body.credential);

  if (!payload?.email) {
    throw new ApiError(401, "Google account email could not be verified");
  }

  const email = String(payload.email).trim().toLowerCase();
  let user = await getUserByEmailOrGoogleId(email, payload.sub);

  if (!user) {
    user = await createUserRecord({
      name: String(payload.name || payload.given_name || "Google User").trim(),
      email,
      password: generateProviderPassword(),
      avatar: payload.picture,
      googleId: payload.sub,
      isVerified: true
    });
  } else {
    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = payload.sub;
      shouldSave = true;
    }

    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      shouldSave = true;
    }

    if (!user.name && payload.name) {
      user.name = String(payload.name).trim();
      shouldSave = true;
    }

    if (shouldSave) {
      await persistUser(user);
    }
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been disabled");
  }

  sendSuccess(res, 200, "Google sign-in successful", createAuthPayload(user));
});

export const adminLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await getUserByEmail(email);
  if (!user || !(await comparePassword(user, req.body.password)) || user.role !== "admin") {
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
  const channel = String(req.body.channel || "sms").trim().toLowerCase();
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (channel === "email") {
    const rawToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await persistUser(user);

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${rawToken}`;
    const emailResult = await maybeSendEmail({
      email: user.email,
      subject: "Reset your Luxeva password",
      text: `Use this secure link to reset your Luxeva password: ${resetLink}`
    });

    if (!emailResult.sent) {
      throw new ApiError(503, `Email reset is unavailable: ${emailResult.reason}`);
    }

    return sendSuccess(res, 200, "Password reset link sent successfully", {
      channel: "email",
      email
    });
  }

  if (!user.phone) {
    throw new ApiError(400, "This account does not have a phone number configured for OTP reset");
  }

  const otp = generateOtp();
  user.resetPasswordOtpHash = hashOtp(otp);
  user.resetPasswordOtpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);
  user.resetPasswordOtpVerifiedAt = undefined;
  await persistUser(user);

  await sendTwoFactorOtp({
    phone: user.phone,
    otp
  });

  await maybeSendEmail({
    email: user.email,
    subject: "Password reset OTP requested",
    text: "Password reset OTP requested. If you did not request this, you can ignore this message."
  });

  sendSuccess(res, 200, "Password reset OTP sent successfully", {
    channel: "sms",
    maskedPhone: maskPhone(user.phone),
    email
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt || new Date(user.resetPasswordOtpExpiresAt) < new Date()) {
    throw new ApiError(400, "OTP is invalid or expired");
  }

  if (user.resetPasswordOtpHash !== hashOtp(otp)) {
    throw new ApiError(400, "Incorrect OTP");
  }

  user.resetPasswordOtpVerifiedAt = new Date();
  await persistUser(user);

  sendSuccess(res, 200, "OTP verified successfully");
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();

  assertStrongPassword(req.body.password);

  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt || new Date(user.resetPasswordOtpExpiresAt) < new Date()) {
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
  await persistUser(user);

  sendSuccess(res, 200, "Password reset successfully");
});

export const resetPassword = asyncHandler(async (req, res) => {
  assertStrongPassword(req.body.password);
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = isFallbackAuthStore()
    ? await findFallbackUserByResetToken(hashedToken)
    : await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: { $gt: new Date() }
      });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await persistUser(user);

  sendSuccess(res, 200, "Password reset successfully");
});

export const getMe = asyncHandler(async (req, res) => {
  const user = isFallbackAuthStore()
    ? await getUserById(req.user.id)
    : await User.findById(req.user.id).select("-password -resetPasswordToken");
  const addresses = isFallbackAuthStore()
    ? await listFallbackAddresses(req.user.id)
    : await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, 200, "Profile fetched successfully", {
    user: isFallbackAuthStore() ? { ...user, password: undefined, resetPasswordToken: undefined } : user,
    addresses
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = isFallbackAuthStore()
    ? await updateFallbackUser(req.user.id, {
        name: req.body.name,
        phone: req.body.phone,
        avatar: req.body.avatar
      })
    : await User.findByIdAndUpdate(
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
  const user = await getUserById(req.user.id);
  if (!user || !(await comparePassword(user, req.body.currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  assertStrongPassword(req.body.newPassword);
  user.password = req.body.newPassword;
  await persistUser(user);

  sendSuccess(res, 200, "Password changed successfully");
});

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = isFallbackAuthStore()
    ? await listFallbackAddresses(req.user.id)
    : await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, 200, "Addresses fetched successfully", { addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    if (isFallbackAuthStore()) {
      await clearFallbackDefaultAddresses(req.user.id);
    } else {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }
  }

  const address = isFallbackAuthStore()
    ? await createFallbackAddress({
        ...req.body,
        user: req.user.id
      })
    : await Address.create({
        ...req.body,
        user: req.user.id
      });

  if (address.isDefault) {
    if (isFallbackAuthStore()) {
      await updateFallbackUser(req.user.id, { defaultAddressId: address._id });
    } else {
      await User.findByIdAndUpdate(req.user.id, { defaultAddressId: address._id });
    }
  }

  sendSuccess(res, 201, "Address added successfully", { address });
});

export const updateAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault) {
    if (isFallbackAuthStore()) {
      await clearFallbackDefaultAddresses(req.user.id);
    } else {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }
  }

  const address = isFallbackAuthStore()
    ? await updateFallbackAddress(req.params.id, req.user.id, req.body)
    : await Address.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (address.isDefault) {
    if (isFallbackAuthStore()) {
      await updateFallbackUser(req.user.id, { defaultAddressId: address._id });
    } else {
      await User.findByIdAndUpdate(req.user.id, { defaultAddressId: address._id });
    }
  }

  sendSuccess(res, 200, "Address updated successfully", { address });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = isFallbackAuthStore()
    ? await deleteFallbackAddress(req.params.id, req.user.id)
    : await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  sendSuccess(res, 200, "Address removed successfully");
});
