import axios from "axios";

let authTokenGetter = null;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: false
});

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

api.interceptors.request.use(async (config) => {
  const token = authTokenGetter ? await authTokenGetter() : null;
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
    sync: "/api/auth/sync",
    me: "/api/auth/me",
    profile: "/api/auth/profile",
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
    lowStock: "/api/catalog/admin/inventory/low-stock",
    adminMedia: "/api/catalog/admin/media",
    adminMediaDelete: (publicId) => `/api/catalog/admin/media/${encodeURIComponent(publicId)}`
  },
  orders: {
    cart: "/api/orders/cart",
    create: "/api/orders",
    mine: "/api/orders/mine",
    detail: (id) => `/api/orders/mine/${id}`,
    razorpayOrder: "/api/orders/payments/razorpay/order",
    razorpayVerify: "/api/orders/payments/razorpay/verify",
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
