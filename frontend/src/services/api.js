import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("luxeva_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const endpoints = {
  content: {
    home: "/api/content/home",
    page: (slug) => `/api/content/pages/${slug}`,
    adminBanners: "/api/content/admin/banners",
    adminBlocks: "/api/content/admin/blocks"
  },
  auth: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    google: "/api/auth/google",
    adminLogin: "/api/auth/admin/login",
    me: "/api/auth/me",
    forgotPassword: "/api/auth/forgot-password",
    verifyResetOtp: "/api/auth/verify-reset-otp",
    resetPasswordOtp: "/api/auth/reset-password-otp",
    resetPassword: (token) => `/api/auth/reset-password/${token}`,
    logout: "/api/auth/logout",
    profile: "/api/auth/profile",
    password: "/api/auth/password",
    addresses: "/api/auth/addresses",
    users: "/api/users"
  },
  catalog: {
    meta: "/api/catalog/meta",
    products: "/api/catalog/products",
    product: (slug) => `/api/catalog/products/${slug}`,
    suggestions: "/api/catalog/products/suggestions",
    wishlist: "/api/catalog/wishlist",
    toggleWishlist: "/api/catalog/wishlist/toggle",
    review: (productId) => `/api/catalog/products/${productId}/reviews`,
    validateCoupon: "/api/catalog/coupons/validate",
    adminProducts: "/api/catalog/admin/products",
    adminProduct: (id) => `/api/catalog/admin/products/${id}`,
    adminCategories: "/api/catalog/admin/categories",
    adminCategory: (id) => `/api/catalog/admin/categories/${id}`,
    adminBrands: "/api/catalog/admin/brands",
    adminBrand: (id) => `/api/catalog/admin/brands/${id}`,
    adminCoupons: "/api/catalog/admin/coupons",
    adminCoupon: (id) => `/api/catalog/admin/coupons/${id}`,
    adminReviews: "/api/catalog/admin/reviews",
    adminReview: (id) => `/api/catalog/admin/reviews/${id}`,
    uploadImages: "/api/catalog/admin/uploads",
    lowStock: "/api/catalog/admin/inventory/low-stock"
  },
  orders: {
    cart: "/api/orders/cart",
    create: "/api/orders",
    mine: "/api/orders/mine",
    detail: (id) => `/api/orders/mine/${id}`,
    paymentIntent: "/api/orders/payments/intent",
    adminOrders: "/api/orders/admin/all",
    adminAnalytics: "/api/orders/admin/analytics/overview",
    updateStatus: (id) => `/api/orders/admin/${id}/status`
  },
  notifications: {
    mine: "/api/notifications/mine",
    markRead: (id) => `/api/notifications/mine/${id}/read`,
    admin: "/api/notifications/admin/all"
  }
};

export default api;
