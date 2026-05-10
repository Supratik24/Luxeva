import bcrypt from "bcryptjs";
import fs from "fs/promises";
import os from "os";
import path from "path";

const storePath = path.join(os.tmpdir(), "luxeva-auth-fallback-store.json");

const defaultStore = {
  users: [],
  addresses: []
};

const ensureStoreDirectory = async () => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
};

const readStore = async () => {
  await ensureStoreDirectory();

  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      addresses: Array.isArray(parsed.addresses) ? parsed.addresses : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeStore(defaultStore);
      return { ...defaultStore };
    }

    throw error;
  }
};

const writeStore = async (store) => {
  await ensureStoreDirectory();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
};

const buildId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureDefaultAdmin = async (store) => {
  const adminEmail = "admin@luxeva.com";
  if (store.users.some((user) => user.email === adminEmail)) {
    return store;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  store.users.push({
    _id: "fallback-admin",
    name: "Supratik Admin",
    email: adminEmail,
    password: hashedPassword,
    phone: "8918654138",
    avatar: "",
    googleId: "",
    role: "admin",
    isActive: true,
    isVerified: true,
    defaultAddressId: "",
    wishlistProductIds: [],
    recentlyViewed: [],
    resetPasswordToken: "",
    resetPasswordExpiresAt: null,
    resetPasswordOtpHash: "",
    resetPasswordOtpExpiresAt: null,
    resetPasswordOtpVerifiedAt: null,
    signupOtpHash: "",
    signupOtpExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await writeStore(store);
  return store;
};

const getStore = async () => ensureDefaultAdmin(await readStore());

export const isFallbackAuthStore = () => process.env.AUTH_FALLBACK_MODE === "memory";

export const findFallbackUserByEmail = async (email) => {
  const store = await getStore();
  return store.users.find((user) => user.email === email) || null;
};

export const findFallbackUserById = async (id) => {
  const store = await getStore();
  return store.users.find((user) => user._id === id) || null;
};

export const findFallbackUserByEmailOrGoogleId = async (email, googleId) => {
  const store = await getStore();
  return (
    store.users.find((user) => user.email === email || (googleId && user.googleId === googleId)) || null
  );
};

export const findFallbackUserByResetToken = async (hashedToken) => {
  const store = await getStore();
  return (
    store.users.find(
      (user) =>
        user.resetPasswordToken === hashedToken &&
        user.resetPasswordExpiresAt &&
        new Date(user.resetPasswordExpiresAt) > new Date()
    ) || null
  );
};

export const saveFallbackUser = async (user) => {
  const store = await getStore();
  const now = new Date().toISOString();
  const nextUser = {
    ...user,
    updatedAt: now
  };

  if (nextUser.password && !String(nextUser.password).startsWith("$2")) {
    nextUser.password = await bcrypt.hash(nextUser.password, 12);
  }

  if (!nextUser._id) {
    nextUser._id = buildId("user");
    nextUser.createdAt = now;
  }

  const index = store.users.findIndex((entry) => entry._id === nextUser._id);
  if (index >= 0) {
    store.users[index] = nextUser;
  } else {
    store.users.push(nextUser);
  }

  await writeStore(store);
  return nextUser;
};

export const createFallbackUser = async (payload) => {
  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const nextUser = {
    _id: buildId("user"),
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    phone: payload.phone || "",
    avatar: payload.avatar || "",
    googleId: payload.googleId || "",
    role: payload.role || "user",
    isActive: payload.isActive ?? true,
    isVerified: payload.isVerified ?? false,
    defaultAddressId: payload.defaultAddressId || "",
    wishlistProductIds: payload.wishlistProductIds || [],
    recentlyViewed: payload.recentlyViewed || [],
    resetPasswordToken: payload.resetPasswordToken || "",
    resetPasswordExpiresAt: payload.resetPasswordExpiresAt || null,
    resetPasswordOtpHash: payload.resetPasswordOtpHash || "",
    resetPasswordOtpExpiresAt: payload.resetPasswordOtpExpiresAt || null,
    resetPasswordOtpVerifiedAt: payload.resetPasswordOtpVerifiedAt || null,
    signupOtpHash: payload.signupOtpHash || "",
    signupOtpExpiresAt: payload.signupOtpExpiresAt || null,
    createdAt: now,
    updatedAt: now
  };

  return saveFallbackUser(nextUser);
};

export const compareFallbackPassword = (user, candidatePassword) =>
  bcrypt.compare(candidatePassword, user.password);

export const updateFallbackUser = async (id, updates) => {
  const user = await findFallbackUserById(id);
  if (!user) {
    return null;
  }

  let nextUser = {
    ...user,
    ...updates
  };

  if (updates.password && updates.password !== user.password) {
    nextUser.password = await bcrypt.hash(updates.password, 12);
  }

  return saveFallbackUser(nextUser);
};

export const listFallbackAddresses = async (userId) => {
  const store = await getStore();
  return store.addresses
    .filter((address) => address.user === userId)
    .sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));
};

export const clearFallbackDefaultAddresses = async (userId) => {
  const store = await getStore();
  store.addresses = store.addresses.map((address) =>
    address.user === userId ? { ...address, isDefault: false, updatedAt: new Date().toISOString() } : address
  );
  await writeStore(store);
};

export const createFallbackAddress = async (payload) => {
  const store = await getStore();
  const now = new Date().toISOString();
  const address = {
    _id: buildId("address"),
    label: payload.label || "Home",
    fullName: payload.fullName,
    line1: payload.line1,
    line2: payload.line2 || "",
    city: payload.city,
    state: payload.state,
    postalCode: payload.postalCode,
    country: payload.country || "India",
    phone: payload.phone || "",
    isDefault: Boolean(payload.isDefault),
    user: payload.user,
    createdAt: now,
    updatedAt: now
  };

  store.addresses.push(address);
  await writeStore(store);
  return address;
};

export const updateFallbackAddress = async (addressId, userId, updates) => {
  const store = await getStore();
  const index = store.addresses.findIndex((address) => address._id === addressId && address.user === userId);
  if (index < 0) {
    return null;
  }

  store.addresses[index] = {
    ...store.addresses[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await writeStore(store);
  return store.addresses[index];
};

export const deleteFallbackAddress = async (addressId, userId) => {
  const store = await getStore();
  const index = store.addresses.findIndex((address) => address._id === addressId && address.user === userId);
  if (index < 0) {
    return null;
  }

  const [deleted] = store.addresses.splice(index, 1);
  await writeStore(store);
  return deleted;
};
