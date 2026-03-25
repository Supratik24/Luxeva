import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Meta from "../components/ui/Meta";
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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, coupon, clearCart } = useShop();
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 250 ? 0 : 18;
  const tax = subtotal * 0.12;
  const total = subtotal + shippingFee + tax - (coupon?.discountAmount || 0);

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(endpoints.orders.create, {
        items: cart,
        shippingAddress: address,
        paymentMethod,
        coupon
      });
      clearCart();
      toast.success("Order placed successfully");
      navigate(`/dashboard?tab=orders&highlight=${data.order._id}`);
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
            <div className="grid gap-3 sm:grid-cols-3">
              {["card", "cod", "stripe"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold capitalize ${
                    paymentMethod === method ? "bg-ink text-white" : "border border-ink/10 dark:border-white/10"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={submitting} className="mt-8 rounded-full bg-olive px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Placing order..." : "Place order"}
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
            <div className="flex justify-between"><span>Discount</span><span>-{currency(coupon?.discountAmount || 0)}</span></div>
          </div>
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

