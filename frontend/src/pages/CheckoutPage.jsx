import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Meta from "../components/ui/Meta";
import { useLocalPreviewData } from "../data/mockStorefront";
import { useAuth } from "../contexts/AuthContext";
import { useShop } from "../contexts/ShopContext";
import api, { endpoints } from "../services/api";
import { currency } from "../utils/format";
import { isPreviewAuthEnabled } from "../utils/previewMode";

const initialAddress = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  phone: ""
};

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });

const getRazorpayFriendlyMessage = (errorLike) => {
  const payload = errorLike?.error || errorLike?.response?.data?.error || errorLike?.response?.data || errorLike;
  const description = String(payload?.description || payload?.message || "").trim();
  const code = String(payload?.code || payload?.reason || "").trim().toUpperCase();

  if (description.includes("International cards are not supported")) {
    return "This Razorpay test account does not support international cards. Please use an Indian test card or netbanking.";
  }

  if (description.toLowerCase().includes("pay later") || description.toLowerCase().includes("not available")) {
    return "Pay Later is not enabled for this Razorpay test account. Please try netbanking or another supported test method.";
  }

  if (code === "BAD_REQUEST_ERROR" && description) {
    return description;
  }

  return payload?.message || "Razorpay could not complete this payment method. Please try another supported option.";
};

const razorpayMethods = ["netbanking", "wallet", "paylater"];

const getRazorpayHiddenMethods = (selectedMethod) =>
  ["card", "upi", "emi", ...razorpayMethods.filter((method) => method !== selectedMethod)].map((method) => ({
    method
  }));

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, createPreviewOrder } = useAuth();
  const { cart, coupon, clearCart } = useShop();
  const usePreviewAuth = useLocalPreviewData && isPreviewAuthEnabled;
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("netbanking");
  const [submitting, setSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // ── Wallet state ────────────────────────────────────────────────────────────
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingAddresses(true);
    api.get(endpoints.auth.addresses)
      .then(({ data }) => {
        const addrs = data.addresses || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          setSelectedAddressId(defaultAddr._id);
          setAddress(defaultAddr);
        }
      })
      .catch((err) => console.error("Failed to load addresses", err))
      .finally(() => setLoadingAddresses(false));
  }, [user]);

  // Fetch wallet balance
  useEffect(() => {
    if (!user) return;
    setLoadingWallet(true);
    api.get("/api/auth/wallet")
      .then(({ data }) => setWalletBalance(Number(data.wallet?.balance || 0)))
      .catch(() => setWalletBalance(0))
      .finally(() => setLoadingWallet(false));
  }, [user]);

  const handleAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      setAddress(initialAddress);
    } else {
      const selected = savedAddresses.find((a) => a._id === addrId);
      if (selected) {
        setAddress(selected);
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 2499 ? 0 : 99;
  const tax = subtotal * 0.12;
  const total = subtotal + shippingFee + tax - (coupon?.discountAmount || 0);
  const normalizedContact = String(address.phone || user?.phone || "").replace(/\D/g, "").slice(-10);
  const customerName = (address.fullName || user?.name || "").trim();
  const customerEmail = (user?.email || "").trim();

  // ── Wallet calculation ───────────────────────────────────────────────────────
  const walletAmountToUse = useWallet ? Math.min(walletBalance, total) : 0;
  const razorpayChargeable = Math.max(0, Number((total - walletAmountToUse).toFixed(2)));
  const isFullyPaidByWallet = useWallet && walletAmountToUse >= total;

  const orderPayload = {
    items: cart,
    customer: {
      name: customerName && customerName.toLowerCase() !== "user" ? customerName : (address.fullName || user?.name || "Customer"),
      email: customerEmail,
      phone: normalizedContact
    },
    shippingAddress: address,
    billingAddress: address,
    paymentMethod: isFullyPaidByWallet ? "luxeva_wallet" : paymentMethod,
    coupon,
    walletAmount: walletAmountToUse
  };

  const finishPreviewOrder = async (paymentDetails = null, method = paymentMethod) => {
    const { order } = await createPreviewOrder({
      items: cart,
      totals: {
        subtotal,
        shippingFee,
        tax,
        total
      },
      shippingAddress: address,
      paymentMethod: method,
      coupon,
      paymentDetails
    });
    clearCart();
    toast.success("Order placed successfully");
    navigate(`/dashboard?tab=orders&highlight=${order._id}`);
  };

  const placeRazorpayOrder = async (selectedMethod) => {
    // Include walletAmount so backend returns reduced Razorpay charge
    const { data } = await api.post(endpoints.orders.razorpayOrder, {
      items: cart,
      coupon,
      walletAmount: walletAmountToUse
    });

    // Backend says wallet covers 100% — place order directly without Razorpay
    if (data.fullyPaidByWallet) {
      const { data: orderData } = await api.post(endpoints.orders.create, {
        ...orderPayload
      });
      clearCart();
      toast.success(`Order placed! ₹${walletAmountToUse.toFixed(2)} deducted from your Luxeva Wallet.`);
      navigate(`/dashboard?tab=orders&highlight=${orderData.order._id}`);
      return;
    }

    await loadRazorpayCheckout();

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "Luxeva",
        description: walletAmountToUse > 0
          ? `Secure checkout (₹${walletAmountToUse.toFixed(2)} paid via Wallet)`
          : "Secure checkout payment",
        order_id: data.order.id,
        prefill: {
          name: address.fullName || user?.name || "",
          email: user?.email || "",
          contact: normalizedContact
        },
        notes: {
          userId: user?.id || user?._id || "",
          email: user?.email || "",
          fullName: address.fullName || user?.name || "",
          phone: normalizedContact,
          addressLine1: address.line1,
          city: address.city,
          postalCode: address.postalCode,
          walletAmountUsed: String(walletAmountToUse)
        },
        config: {
          display: {
            language: "en",
            hide: getRazorpayHiddenMethods(selectedMethod),
            preferences: {
              show_default_blocks: true
            }
          }
        },
        remember_customer: true,
        theme: {
          color: "#5f6f52"
        },
        handler: async (response) => {
          try {
            await api.post(endpoints.orders.razorpayVerify, response);

            if (usePreviewAuth) {
              await finishPreviewOrder(response, selectedMethod);
            } else {
              const { data: orderData } = await api.post(endpoints.orders.create, {
                ...orderPayload,
                paymentMethod: selectedMethod,
                razorpay: response
              });
              clearCart();
              const msg = walletAmountToUse > 0
                ? `Payment verified! ₹${walletAmountToUse.toFixed(2)} from Wallet + ₹${(total - walletAmountToUse).toFixed(2)} via ${selectedMethod}.`
                : "Payment verified and order placed";
              toast.success(msg);
              navigate(`/dashboard?tab=orders&highlight=${orderData.order._id}`);
            }

            resolve(response);
          } catch (error) {
            console.error("Razorpay success handler failed", {
              verifyOrCreateOrderError: error?.response?.data || error?.message || error,
              razorpayResponse: response
            });
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Razorpay payment was cancelled"))
        }
      });

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed", response?.error || response);
        const paymentError = new Error(getRazorpayFriendlyMessage(response));
        paymentError.razorpay = response;
        reject(paymentError);
      });

      razorpay.open();
    });
  };

  const hasOutOfStockItems = cart.some(
    (item) => item.stock !== undefined && Number(item.stock) <= 0
  );
  const hasOverStockItems = cart.some(
    (item) => item.stock !== undefined && Number(item.stock) > 0 && item.quantity > Number(item.stock)
  );
  const blockCheckout = hasOutOfStockItems || hasOverStockItems;

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (hasOutOfStockItems) {
      toast.error("Some items in your cart are currently out of stock. Please return to your cart.");
      navigate("/cart");
      return;
    }

    if (hasOverStockItems) {
      toast.error("Some items exceed available stock. Please adjust quantities in your cart.");
      navigate("/cart");
      return;
    }

    setSubmitting(true);
    try {
      if (razorpayMethods.includes(paymentMethod) && !isFullyPaidByWallet) {
        await placeRazorpayOrder(paymentMethod);
        return;
      }

      if (usePreviewAuth) {
        await finishPreviewOrder(null, paymentMethod);
        return;
      }

      const { data } = await api.post(endpoints.orders.create, {
        ...orderPayload
      });
      clearCart();
      const walletMsg = walletAmountToUse > 0
        ? ` ₹${walletAmountToUse.toFixed(2)} deducted from your Luxeva Wallet.`
        : "";
      toast.success(`Order placed successfully!${walletMsg}`);
      navigate(`/dashboard?tab=orders&highlight=${data.order._id}`);
    } catch (error) {
      console.error("Checkout failed", error?.response?.data || error);
      if (error.message === "Razorpay payment was cancelled") {
        toast.error("Payment cancelled");
      } else if (error.razorpay) {
        toast.error(getRazorpayFriendlyMessage(error.razorpay));
      } else {
        toast.error(error?.response?.data?.message || error?.message || "Unable to place order");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Checkout" description="Secure checkout with shipping details and payment options." />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={placeOrder} className="glass rounded-[2rem] p-6 shadow-soft">
          <p className="eyebrow">Checkout</p>
          <h1 className="mt-3 font-display text-4xl">Complete your order</h1>
          
          {savedAddresses.length > 0 && (
            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold">Delivery address</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr._id}
                    type="button"
                    onClick={() => handleAddressSelect(addr._id)}
                    className={`rounded-2xl p-4 text-left border transition ${
                      selectedAddressId === addr._id
                        ? "border-ink bg-ink/5 dark:border-white dark:bg-white/5"
                        : "border-ink/10 hover:border-ink/30 dark:border-white/10 dark:hover:border-white/30"
                    }`}
                  >
                    <p className="font-semibold text-sm">{addr.fullName}</p>
                    <p className="mt-1 text-xs text-ink/70 dark:text-white/70 line-clamp-2">
                      {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} {addr.postalCode}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddressSelect("new")}
                  className={`rounded-2xl p-4 text-left border flex items-center justify-center transition ${
                    selectedAddressId === "new"
                      ? "border-ink bg-ink/5 dark:border-white dark:bg-white/5"
                      : "border-ink/10 hover:border-ink/30 dark:border-white/10 dark:hover:border-white/30"
                  }`}
                >
                  <span className="font-semibold text-sm">+ Add new address</span>
                </button>
              </div>
            </div>
          )}

          {selectedAddressId === "new" && (
            <div className={`grid gap-4 sm:grid-cols-2 ${savedAddresses.length > 0 ? "mt-4" : "mt-8"}`}>
              {Object.keys(initialAddress).map((key) => (
                <input
                  key={key}
                  value={address[key] || ""}
                  onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                  className={`rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none capitalize dark:border-white/10 ${
                    key === "line1" || key === "line2" ? "sm:col-span-2" : ""
                  }`}
                />
              ))}
            </div>
          )}

          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold">Payment method</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["netbanking", "Netbanking"],
                ["wallet", "Wallet"],
                ["paylater", "Pay Later"],
                ["cod", "Cash on delivery"]
              ].map(([method, label]) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold capitalize ${
                    paymentMethod === method ? "bg-ink text-white" : "border border-ink/10 dark:border-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Luxeva Wallet Toggle ─────────────────────────────────────── */}
          {walletBalance > 0 && (
            <div className="mt-5 rounded-2xl border border-olive/30 bg-olive/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-olive">💰 Luxeva Wallet</p>
                  <p className="text-xs text-ink/60 dark:text-white/60 mt-0.5">
                    Available: <span className="font-semibold">{currency(walletBalance)}</span>
                  </p>
                  {useWallet && walletAmountToUse > 0 && (
                    <p className="text-xs text-olive font-medium mt-1">
                      {isFullyPaidByWallet
                        ? `✅ Full order covered by wallet`
                        : `✅ ${currency(walletAmountToUse)} wallet + ${currency(razorpayChargeable)} via ${paymentMethod}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setUseWallet((v) => !v)}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                    useWallet ? "bg-olive" : "bg-ink/15 dark:bg-white/15"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${useWallet ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || blockCheckout}
            className={`mt-8 rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
              blockCheckout
                ? "bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed opacity-75"
                : "bg-olive hover:opacity-90 shadow-soft"
            }`}
          >
            {submitting
              ? "Processing..."
              : blockCheckout
                ? "Items out of stock in cart"
                : paymentMethod === "cod"
                  ? "Place order"
                  : `Continue with ${paymentMethod === "paylater" ? "Pay Later" : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`}
          </button>
        </form>
        <aside className="glass h-fit rounded-[2rem] p-6 shadow-soft">
          <h2 className="font-display text-3xl">Summary</h2>
          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.color}-${item.size}`} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className={`h-14 w-14 rounded-2xl object-cover ${item.stock !== undefined && Number(item.stock) <= 0 ? "grayscale-[40%] opacity-70" : ""}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-ink/45 dark:text-white/65">
                    Qty {item.quantity}
                    {item.stock !== undefined && Number(item.stock) <= 0 ? (
                      <span className="ml-2 font-semibold text-rose-500">• Out of stock</span>
                    ) : item.stock !== undefined && Number(item.stock) > 0 && item.quantity > Number(item.stock) ? (
                      <span className="ml-2 font-semibold text-amber-500">• Only {item.stock} left</span>
                    ) : null}
                  </p>
                </div>
                <p className="text-sm font-semibold">{currency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{currency(shippingFee)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{currency(tax)}</span></div>
            <div className="flex justify-between text-olive"><span>Discount</span><span>-{currency(coupon?.discountAmount || 0)}</span></div>
            {useWallet && walletAmountToUse > 0 && (
              <div className="flex justify-between text-olive font-medium">
                <span>💰 Wallet</span>
                <span>-{currency(walletAmountToUse)}</span>
              </div>
            )}
          </div>
          {coupon?.code ? (
            <div className="mt-5 rounded-[1.4rem] border border-olive/25 bg-olive/10 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">Coupon applied</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-display text-2xl">{coupon.code}</p>
                <p className="font-semibold text-olive">Saved {currency(coupon.discountAmount)}</p>
              </div>
              <p className="mt-2 text-xs text-ink/55 dark:text-white/55">{coupon.label}</p>
            </div>
          ) : null}
          <div className="mt-6 flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
          {useWallet && walletAmountToUse > 0 && (
            <div className="mt-3 rounded-xl bg-olive/10 px-4 py-3">
              {isFullyPaidByWallet ? (
                <p className="text-sm font-semibold text-olive">✅ Fully paid from Luxeva Wallet</p>
              ) : (
                <>
                  <div className="flex justify-between text-sm text-olive">
                    <span>Wallet covers</span>
                    <span>-{currency(walletAmountToUse)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-1">
                    <span>Pay via {paymentMethod}</span>
                    <span>{currency(razorpayChargeable)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
