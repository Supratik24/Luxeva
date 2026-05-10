import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocalPreviewData } from "../data/mockStorefront";
import api, { endpoints } from "../services/api";
import { maskEmail, normalizeEmail } from "../utils/authValidation";
import { readStorage, writeStorage } from "../utils/storage";

const AuthContext = createContext(null);
const TOKEN_KEY = "luxeva_token";
const PREVIEW_USERS_KEY = "luxeva_preview_users";
const PREVIEW_SESSION_KEY = "luxeva_preview_session";
const PREVIEW_PENDING_SIGNUP_KEY = "luxeva_preview_pending_signup";
const usePreviewAuth = useLocalPreviewData && import.meta.env.VITE_USE_PREVIEW_AUTH !== "false";

const defaultAdminUser = {
  _id: "preview-admin",
  name: "Supratik Admin",
  email: "admin@luxeva.com",
  phone: "8918654138",
  role: "admin",
  avatar: "",
  addresses: [
    {
      _id: "address-admin-1",
      label: "Office",
      fullName: "Supratik Admin",
      line1: "Salt Lake Sector V",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700091"
    }
  ],
  orders: [
    {
      _id: "order-admin-1",
      orderNumber: "LX-240301",
      status: "delivered",
      total: 8499,
      createdAt: "2026-03-20T10:30:00.000Z"
    },
    {
      _id: "order-admin-2",
      orderNumber: "LX-240417",
      status: "shipped",
      total: 12999,
      createdAt: "2026-03-25T15:10:00.000Z"
    }
  ],
  notifications: [
    {
      _id: "notification-admin-1",
      title: "Your premium picks are on the way",
      message: "Track your latest order from the dashboard.",
      createdAt: "2026-03-25T16:00:00.000Z"
    },
    {
      _id: "notification-admin-2",
      title: "Wishlist price drop",
      message: "One of your saved products is now available at a better price.",
      createdAt: "2026-03-24T12:00:00.000Z"
    }
  ]
};

const createPreviewError = (message) => {
  const error = new Error(message);
  error.response = { data: { message } };
  return error;
};

const getPreviewUsers = () => {
  const storedUsers = readStorage(PREVIEW_USERS_KEY, []);
  if (!storedUsers.find((entry) => entry.email === defaultAdminUser.email)) {
    const nextUsers = [...storedUsers, { ...defaultAdminUser, password: "Admin@123" }];
    writeStorage(PREVIEW_USERS_KEY, nextUsers);
    return nextUsers;
  }

  return storedUsers;
};

const writePreviewUsers = (users) => {
  writeStorage(PREVIEW_USERS_KEY, users);
};

const buildPreviewUser = (values) => ({
  _id: `preview-user-${Date.now()}`,
  name: String(values.name || "").trim(),
  email: normalizeEmail(values.email),
  phone: String(values.phone || "").trim(),
  role: "user",
  avatar: "",
  addresses: [
    {
      _id: `address-${Date.now()}`,
      label: "Home",
      fullName: String(values.name || "").trim(),
      line1: "Ballygunge Place",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700019"
    }
  ],
  orders: [
    {
      _id: `order-${Date.now()}-1`,
      orderNumber: `LX-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "packed",
      total: 3299,
      createdAt: new Date().toISOString()
    }
  ],
  notifications: [
    {
      _id: `notification-${Date.now()}-1`,
      title: "Account created",
      message: "Your Luxeva preview account is ready to explore.",
      createdAt: new Date().toISOString()
    }
  ]
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.details?.[0]?.msg || error?.response?.data?.message || fallback;

  const mergeUserState = (baseUser, extras = {}) => ({
    ...baseUser,
    ...extras,
    addresses: extras.addresses ?? baseUser?.addresses ?? [],
    orders: extras.orders ?? baseUser?.orders ?? [],
    notifications: extras.notifications ?? baseUser?.notifications ?? []
  });

  const fetchProfile = async () => {
    if (usePreviewAuth) {
      const session = readStorage(PREVIEW_SESSION_KEY, null);
      if (!session?.user || !session?.token) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setLoading(false);
        return null;
      }

      localStorage.setItem(TOKEN_KEY, session.token);
      setToken(session.token);
      setUser(session.user);
      setLoading(false);
      return session.user;
    }

    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get(endpoints.auth.me);
      const nextUser = mergeUserState(user || data.user, {
        ...data.user,
        addresses: data.addresses || user?.addresses || data.user?.addresses || []
      });
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const persistSession = (payload) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    if (usePreviewAuth) {
      writeStorage(PREVIEW_SESSION_KEY, payload);
    }
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (values, admin = false) => {
    if (usePreviewAuth) {
      const email = normalizeEmail(values.email);
      const password = String(values.password || "");
      const users = getPreviewUsers();
      const account = users.find((entry) => entry.email === email && entry.password === password);

      if (!account) {
        throw createPreviewError("Invalid email or password");
      }

      if (admin && account.role !== "admin") {
        throw createPreviewError("This account does not have admin access");
      }

      const payload = {
        token: `preview-token-${account._id}`,
        user: { ...account }
      };
      delete payload.user.password;
      persistSession(payload);
      toast.success(admin ? "Admin access granted" : "Welcome back");
      return payload;
    }

    try {
      const payload = {
        ...values,
        email: String(values.email || "").trim().toLowerCase()
      };
      const { data } = await api.post(admin ? endpoints.auth.adminLogin : endpoints.auth.login, payload);
      persistSession(data);
      toast.success(admin ? "Admin access granted" : "Welcome back");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed"));
      throw error;
    }
  };

  const signup = async (values) => {
    if (usePreviewAuth) {
      const email = normalizeEmail(values.email);
      const users = getPreviewUsers();

      if (users.some((entry) => entry.email === email)) {
        throw createPreviewError("An account with this email already exists");
      }

      const pendingSignup = {
        ...buildPreviewUser(values),
        password: String(values.password || ""),
        otp: "123456"
      };

      writeStorage(PREVIEW_PENDING_SIGNUP_KEY, pendingSignup);
      toast.success(`Signup OTP sent to ${maskEmail(pendingSignup.email)}`);
      return {
        message: "Signup OTP sent",
        maskedEmail: maskEmail(pendingSignup.email)
      };
    }

    try {
      const payload = {
        ...values,
        name: String(values.name || "").trim(),
        email: String(values.email || "").trim().toLowerCase(),
        phone: String(values.phone || "").trim()
      };
      const { data } = await api.post(endpoints.auth.signup, payload);
      toast.success(`Signup OTP sent to ${data.maskedEmail || data.email}`);
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Signup failed"));
      throw error;
    }
  };

  const verifySignupOtp = async (values) => {
    if (usePreviewAuth) {
      const pendingSignup = readStorage(PREVIEW_PENDING_SIGNUP_KEY, null);
      const email = normalizeEmail(values.email);
      const otp = String(values.otp || "").trim();

      if (!pendingSignup || pendingSignup.email !== email) {
        throw createPreviewError("No pending signup found for this email");
      }

      if (otp !== pendingSignup.otp) {
        throw createPreviewError("Please enter the demo OTP 123456");
      }

      const users = getPreviewUsers();
      const nextUser = { ...pendingSignup };
      delete nextUser.otp;
      writePreviewUsers([...users, nextUser]);
      localStorage.removeItem(PREVIEW_PENDING_SIGNUP_KEY);

      const payload = {
        token: `preview-token-${nextUser._id}`,
        user: { ...nextUser }
      };
      delete payload.user.password;
      persistSession(payload);
      toast.success("Account verified");
      return payload;
    }

    try {
      const payload = {
        email: String(values.email || "").trim().toLowerCase(),
        otp: String(values.otp || "").trim()
      };
      const { data } = await api.post(endpoints.auth.verifySignupOtp, payload);
      persistSession(data);
      toast.success("Account verified");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "OTP verification failed"));
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    if (usePreviewAuth) {
      const previewUser = {
        _id: "preview-google-user",
        name: "Google Preview User",
        email: "preview.google@luxeva.com",
        phone: "9000000000",
        role: "user",
        avatar: "",
        addresses: [],
        orders: [],
        notifications: [
          {
            _id: "notification-google-1",
            title: "Signed in with Google",
            message: "Google sign-in is running in preview mode.",
            createdAt: new Date().toISOString()
          }
        ]
      };
      const payload = {
        token: `preview-token-google-${credential?.slice?.(0, 8) || "demo"}`,
        user: previewUser
      };
      persistSession(payload);
      toast.success("Signed in with Google");
      return payload;
    }

    try {
      const { data } = await api.post(endpoints.auth.google, { credential });
      persistSession(data);
      toast.success("Signed in with Google");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-in failed"));
      throw error;
    }
  };

  const logout = async () => {
    if (usePreviewAuth) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PREVIEW_SESSION_KEY);
      setToken(null);
      setUser(null);
      toast.success("Signed out");
      return;
    }

    try {
      await api.post(endpoints.auth.logout);
    } catch (error) {
      // Ignore network logout errors and clear the client session.
    } finally {
      localStorage.removeItem("luxeva_token");
      setToken(null);
      setUser(null);
      toast.success("Signed out");
    }
  };

  const updateProfile = async (profile) => {
    if (usePreviewAuth) {
      const session = readStorage(PREVIEW_SESSION_KEY, null);
      const users = getPreviewUsers();
      if (!session?.user) {
        throw createPreviewError("Please log in again");
      }

      const nextUser = {
        ...session.user,
        ...profile,
        email: normalizeEmail(profile.email || session.user.email)
      };
      const nextUsers = users.map((entry) =>
        entry._id === nextUser._id ? { ...entry, ...nextUser, password: entry.password } : entry
      );

      writePreviewUsers(nextUsers);
      persistSession({
        token: session.token || `preview-token-${nextUser._id}`,
        user: nextUser
      });
      toast.success("Profile updated");
      return { user: nextUser };
    }

    try {
      const { data } = await api.put(endpoints.auth.profile, profile);
      const nextUser = mergeUserState(user || data.user, {
        ...data.user,
        addresses: user?.addresses || data.user?.addresses || [],
        orders: user?.orders || data.user?.orders || [],
        notifications: user?.notifications || data.user?.notifications || []
      });
      setUser(nextUser);
      toast.success("Profile updated");
      return { ...data, user: nextUser };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Profile update failed"));
      throw error;
    }
  };

  const addAddress = async (address) => {
    if (usePreviewAuth) {
      const session = readStorage(PREVIEW_SESSION_KEY, null);
      const users = getPreviewUsers();
      if (!session?.user) {
        throw createPreviewError("Please log in again");
      }

      const nextAddress = {
        _id: `address-${Date.now()}`,
        label: String(address.label || "Home").trim(),
        fullName: String(address.fullName || session.user.name || "").trim(),
        line1: String(address.line1 || "").trim(),
        line2: String(address.line2 || "").trim(),
        city: String(address.city || "").trim(),
        state: String(address.state || "").trim(),
        postalCode: String(address.postalCode || "").trim(),
        country: String(address.country || "India").trim(),
        phone: String(address.phone || session.user.phone || "").trim()
      };

      const nextUser = {
        ...session.user,
        addresses: [nextAddress, ...(session.user.addresses || [])]
      };
      const nextUsers = users.map((entry) =>
        entry._id === nextUser._id ? { ...entry, ...nextUser, password: entry.password } : entry
      );

      writePreviewUsers(nextUsers);
      persistSession({
        token: session.token || `preview-token-${nextUser._id}`,
        user: nextUser
      });
      toast.success("Address added");
      return { address: nextAddress, addresses: nextUser.addresses };
    }

    try {
      const { data } = await api.post(endpoints.auth.addresses, address);
      const nextAddresses = [data.address, ...(user?.addresses || [])];
      const nextUser = user
        ? mergeUserState(user, {
            ...user,
            addresses: nextAddresses
          })
        : null;
      if (nextUser) {
        setUser(nextUser);
      }
      toast.success("Address added");
      return { ...data, addresses: nextAddresses };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Address save failed"));
      throw error;
    }
  };

  const updateAddress = async (addressId, address) => {
    if (usePreviewAuth) {
      const session = readStorage(PREVIEW_SESSION_KEY, null);
      const users = getPreviewUsers();
      if (!session?.user) {
        throw createPreviewError("Please log in again");
      }

      const nextAddresses = (session.user.addresses || []).map((entry) =>
        entry._id === addressId ? { ...entry, ...address } : entry
      );
      const nextUser = {
        ...session.user,
        addresses: nextAddresses
      };
      const nextUsers = users.map((entry) =>
        entry._id === nextUser._id ? { ...entry, ...nextUser, password: entry.password } : entry
      );

      writePreviewUsers(nextUsers);
      persistSession({
        token: session.token || `preview-token-${nextUser._id}`,
        user: nextUser
      });
      toast.success("Address updated");
      return {
        address: nextAddresses.find((entry) => entry._id === addressId),
        addresses: nextAddresses
      };
    }

    try {
      const { data } = await api.put(`${endpoints.auth.addresses}/${addressId}`, address);
      const nextAddresses = (user?.addresses || []).map((entry) =>
        entry._id === addressId ? { ...entry, ...data.address } : entry
      );
      const nextUser = user
        ? mergeUserState(user, {
            ...user,
            addresses: nextAddresses
          })
        : null;
      if (nextUser) {
        setUser(nextUser);
      }
      toast.success("Address updated");
      return { ...data, addresses: nextAddresses };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Address update failed"));
      throw error;
    }
  };

  const deleteAddress = async (addressId) => {
    if (usePreviewAuth) {
      const session = readStorage(PREVIEW_SESSION_KEY, null);
      const users = getPreviewUsers();
      if (!session?.user) {
        throw createPreviewError("Please log in again");
      }

      const nextAddresses = (session.user.addresses || []).filter((entry) => entry._id !== addressId);
      const nextUser = {
        ...session.user,
        addresses: nextAddresses
      };
      const nextUsers = users.map((entry) =>
        entry._id === nextUser._id ? { ...entry, ...nextUser, password: entry.password } : entry
      );

      writePreviewUsers(nextUsers);
      persistSession({
        token: session.token || `preview-token-${nextUser._id}`,
        user: nextUser
      });
      toast.success("Address deleted");
      return { addresses: nextAddresses };
    }

    try {
      await api.delete(`${endpoints.auth.addresses}/${addressId}`);
      const nextAddresses = (user?.addresses || []).filter((entry) => entry._id !== addressId);
      const nextUser = user
        ? mergeUserState(user, {
            ...user,
            addresses: nextAddresses
          })
        : null;
      if (nextUser) {
        setUser(nextUser);
      }
      toast.success("Address deleted");
      return { addresses: nextAddresses };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Address delete failed"));
      throw error;
    }
  };

  const createPreviewOrder = async ({ items, totals, shippingAddress, paymentMethod, coupon, paymentDetails }) => {
    const session = readStorage(PREVIEW_SESSION_KEY, null);
    const users = getPreviewUsers();

    if (!session?.user) {
      throw createPreviewError("Please log in before placing an order");
    }

    const orderId = `order-${Date.now()}`;
    const order = {
      _id: orderId,
      orderNumber: `LX-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "packed",
      items,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      tax: totals.tax,
      total: totals.total,
      coupon: coupon || null,
      shippingAddress,
      paymentMethod,
      paymentDetails: paymentDetails || null,
      createdAt: new Date().toISOString()
    };

    const notification = {
      _id: `notification-${Date.now()}`,
      title: "Order placed successfully",
      message: `${order.orderNumber} has been added to your order history.`,
      createdAt: new Date().toISOString()
    };

    const nextUser = {
      ...session.user,
      orders: [order, ...(session.user.orders || [])],
      notifications: [notification, ...(session.user.notifications || [])]
    };

    const nextUsers = users.map((entry) =>
      entry._id === nextUser._id ? { ...entry, ...nextUser, password: entry.password } : entry
    );

    writePreviewUsers(nextUsers);
    persistSession({
      token: session.token || `preview-token-${nextUser._id}`,
      user: nextUser
    });

    return { order };
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      googleLogin,
      signup,
      verifySignupOtp,
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      createPreviewOrder,
      refreshProfile: fetchProfile,
      setUser
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
