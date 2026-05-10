import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Meta from "../components/ui/Meta";
import { useLocalPreviewData } from "../data/mockStorefront";
import { useAuth } from "../contexts/AuthContext";
import { useShop } from "../contexts/ShopContext";
import api, { endpoints } from "../services/api";
import { currency } from "../utils/format";

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
  const usePreviewAuth = useLocalPreviewData && import.meta.env.VITE_USE_PREVIEW_AUTH !== "false";
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("netbanking");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 2499 ? 0 : 99;
  const tax = subtotal * 0.12;
  const total = subtotal + shippingFee + tax - (coupon?.discountAmount || 0);
  const normalizedContact = String(address.phone || user?.phone || "").replace(/\D/g, "").slice(-10);
  const orderPayload = {
    items: cart,
    shippingAddress: address,
    billingAddress: address,
    paymentMethod,
    coupon
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
    const { data } = await api.post(endpoints.orders.razorpayOrder, {
      items: cart,
      coupon
    });

    await loadRazorpayCheckout();

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "Luxeva",
        description: "Secure checkout payment",
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
          postalCode: address.postalCode
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
              toast.success("Payment verified and order placed");
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

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      if (razorpayMethods.includes(paymentMethod)) {
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
      toast.success("Order placed successfully");
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {Object.entries(address).map(([key, value]) => (
              <input
                key={key}
                value={value}
                onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={key}
                className={`rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none capitalize dark:border-white/10 ${
                  key === "line1" || key === "line2" ? "sm:col-span-2" : ""
                }`}
              />
            ))}
          </div>
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
          <button type="submit" disabled={submitting} className="mt-8 rounded-full bg-olive px-6 py-4 text-sm font-semibold text-white">
            {submitting
              ? "Processing..."
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
                <img src={item.image} alt={item.name} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-ink/45 dark:text-white/45">Qty {item.quantity}</p>
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
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
