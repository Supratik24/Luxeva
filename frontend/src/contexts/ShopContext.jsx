import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import { mockCoupons, mockProducts, useLocalPreviewData } from "../data/mockStorefront";
import api, { endpoints } from "../services/api";
import { readStorage, writeStorage } from "../utils/storage";
import { useAuth } from "./AuthContext";

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(() => readStorage("luxeva_cart", []));
  const [wishlist, setWishlist] = useState(() => readStorage("luxeva_wishlist", []));
  const [recentlyViewed, setRecentlyViewed] = useState(() => readStorage("luxeva_recent", []));
  const [quickView, setQuickView] = useState(null);
  const [coupon, setCoupon] = useState(() => readStorage("luxeva_coupon", null));

  useEffect(() => {
    writeStorage("luxeva_cart", cart);
  }, [cart]);

  useEffect(() => {
    writeStorage("luxeva_recent", recentlyViewed);
  }, [recentlyViewed]);

  useEffect(() => {
    writeStorage("luxeva_coupon", coupon);
  }, [coupon]);

  useEffect(() => {
    writeStorage("luxeva_wishlist", wishlist);
  }, [wishlist]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }

    if (useLocalPreviewData) {
      setWishlist(readStorage("luxeva_wishlist", []));
      return;
    }

    api
      .get(endpoints.catalog.wishlist)
      .then(({ data }) => setWishlist(data.wishlist.products || []))
      .catch(() => setWishlist([]));

    api
      .get(endpoints.orders.cart)
      .then(({ data }) => {
        if (data.cart?.items?.length) {
          setCart(data.cart.items);
          setCoupon(data.cart.coupon || null);
        }
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  const syncRemoteCart = useEffectEvent(async (nextCart, nextCoupon) => {
    if (!isAuthenticated || useLocalPreviewData) {
      return;
    }

    try {
      await api.put(endpoints.orders.cart, {
        items: nextCart,
        coupon: nextCoupon
      });
    } catch (error) {
      console.error("Cart sync failed", error);
    }
  });

  useEffect(() => {
    syncRemoteCart(cart, coupon);
  }, [cart, coupon, syncRemoteCart]);

  const addToCart = (product, selection = {}) => {
    startTransition(() => {
      setCart((current) => {
        const match = current.find(
          (item) =>
            item.productId === product._id &&
            item.color === selection.color &&
            item.size === selection.size
        );

        if (match) {
          return current.map((item) =>
            item === match ? { ...item, quantity: Math.min(item.quantity + 1, product.stock || 10) } : item
          );
        }

        return [
          ...current,
          {
            productId: product._id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0]?.url,
            price: product.price,
            quantity: 1,
            color: selection.color || product.colors?.[0],
            size: selection.size || product.sizes?.[0],
            stock: product.stock
          }
        ];
      });
    });

    toast.success("Added to cart");
  };

  const updateQuantity = (productId, quantity, selection = {}) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.color === selection.color && item.size === selection.size
            ? { ...item, quantity: Math.max(quantity, 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId, selection = {}) => {
    setCart((current) =>
      current.filter(
        (item) =>
          !(
            item.productId === productId &&
            (selection.color ? item.color === selection.color : true) &&
            (selection.size ? item.size === selection.size : true)
          )
      )
    );
    toast.success("Removed from cart");
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.error("Please log in to save favorites");
      return;
    }

    if (useLocalPreviewData) {
      const product = mockProducts.find((entry) => entry._id === productId);
      if (!product) {
        toast.error("Product not found");
        return;
      }

      const exists = wishlist.some((entry) => entry._id === productId);
      const nextWishlist = exists
        ? wishlist.filter((entry) => entry._id !== productId)
        : [product, ...wishlist];

      setWishlist(nextWishlist);
      toast.success(exists ? "Removed from wishlist" : "Saved to wishlist");
      return;
    }

    const { data } = await api.post(endpoints.catalog.toggleWishlist, { productId });
    setWishlist(data.wishlist.products || []);
    toast.success(data.message);
  };

  const saveRecentlyViewed = (product) => {
    setRecentlyViewed((current) => {
      const next = [product, ...current.filter((item) => item._id !== product._id)];
      return next.slice(0, 6);
    });
  };

  const applyCoupon = async (code) => {
    if (useLocalPreviewData) {
      const normalizedCode = String(code || "").trim().toUpperCase();
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const selectedCoupon = mockCoupons.find((entry) => entry.code === normalizedCode);

      if (!selectedCoupon) {
        toast.error("Invalid coupon code");
        return;
      }

      if (subtotal < selectedCoupon.minOrderAmount) {
        toast.error(`This coupon needs a cart total of Rs. ${selectedCoupon.minOrderAmount} or more`);
        return;
      }

      const rawDiscount =
        selectedCoupon.type === "percentage"
          ? Math.round((subtotal * selectedCoupon.value) / 100)
          : selectedCoupon.value;
      const discountAmount = Math.min(rawDiscount, selectedCoupon.maxDiscount || rawDiscount, subtotal);

      setCoupon({
        code: normalizedCode,
        discountAmount,
        minOrderAmount: selectedCoupon.minOrderAmount,
        label: selectedCoupon.label
      });
      toast.success("Coupon applied");
      return;
    }

    const { data } = await api.post(endpoints.catalog.validateCoupon, { code });
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount =
      data.coupon.type === "percentage"
        ? Number(((subtotal * data.coupon.value) / 100).toFixed(2))
        : data.coupon.value;

    const nextCoupon = {
      code: data.coupon.code,
      discountAmount
    };

    setCoupon(nextCoupon);
    toast.success("Coupon applied");
  };

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      recentlyViewed,
      quickView,
      coupon,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      saveRecentlyViewed,
      setQuickView,
      applyCoupon,
      setCoupon
    }),
    [cart, wishlist, recentlyViewed, quickView, coupon]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }

  return context;
};
