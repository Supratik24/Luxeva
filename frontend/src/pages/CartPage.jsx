import { ArrowRight, BadgePercent, CheckCircle2, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Meta from "../components/ui/Meta";
import { mockCoupons, useLocalPreviewData } from "../data/mockStorefront";
import { useShop } from "../contexts/ShopContext";
import { currency } from "../utils/format";

const CartPage = () => {
  const { cart, coupon, updateQuantity, removeFromCart, applyCoupon } = useShop();
  const [couponCode, setCouponCode] = useState("");
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 2499 ? 0 : 99;
  const tax = subtotal * 0.12;
  const total = subtotal + shipping + tax - (coupon?.discountAmount || 0);
  const couponOffers = useLocalPreviewData
    ? mockCoupons.map((offer) => {
        const rawSaving =
          offer.type === "percentage"
            ? Math.round((subtotal * offer.value) / 100)
            : offer.value;
        const saving = Math.min(rawSaving, offer.maxDiscount || rawSaving, subtotal);
        const remaining = Math.max(offer.minOrderAmount - subtotal, 0);

        return {
          ...offer,
          eligible: subtotal >= offer.minOrderAmount,
          remaining,
          saving
        };
      })
    : [];
  const bestCoupon = couponOffers.reduce(
    (best, offer) => (offer.eligible && offer.saving > (best?.saving || 0) ? offer : best),
    null
  );

  const handleApplyCoupon = (code = couponCode) => {
    const nextCode = String(code || "").trim().toUpperCase();
    if (!nextCode) return;

    setCouponCode(nextCode);
    applyCoupon(nextCode);
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Cart" description="Review and manage your shopping cart before checkout." />
      <div className="mb-10">
        <p className="eyebrow">Cart</p>
        <h1 className="mt-3 font-display text-5xl">Your selected pieces</h1>
      </div>
      {!cart.length ? (
        <div className="glass rounded-[2rem] p-12 text-center shadow-soft">
          <ShoppingBag size={42} className="mx-auto mb-4" />
          <h2 className="font-display text-4xl">Your cart is empty</h2>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <article key={`${item.productId}-${item.color}-${item.size}`} className="glass grid gap-4 rounded-[2rem] p-4 shadow-soft md:grid-cols-[150px_1fr_auto]">
                <img src={item.image || "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80"} alt={item.name} className="h-36 w-full rounded-[1.4rem] object-cover" />
                <div>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="mt-2 text-muted">Color: {item.color || "Default"} | Size: {item.size || "Standard"}</p>
                  <p className="mt-4 font-semibold">{currency(item.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button type="button" onClick={() => removeFromCart(item.productId, item)} className="rounded-full border border-ink/10 p-2 dark:border-white/10">
                    <Trash2 size={16} />
                  </button>
                  <div className="glass inline-flex items-center rounded-full p-2">
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1, item)} className="rounded-full px-3 py-2">
                      -
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1, item)} className="rounded-full px-3 py-2">
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="glass h-fit rounded-[2rem] p-6 shadow-soft">
            <h2 className="font-display text-3xl">Order summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{currency(shipping)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{currency(tax)}</span></div>
              <div className="flex justify-between text-olive"><span>Discount</span><span>-{currency(coupon?.discountAmount || 0)}</span></div>
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-ink/10 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-olive/10 p-2 text-olive">
                    <BadgePercent size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Apply coupon</p>
                    <p className="text-xs text-ink/50 dark:text-white/50">Pick an offer or enter a code</p>
                  </div>
                </div>
                {coupon?.code ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-olive px-3 py-1 text-xs font-semibold text-white">
                    <CheckCircle2 size={13} />
                    Applied
                  </span>
                ) : null}
              </div>

              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  className="w-full rounded-full border border-ink/10 bg-transparent px-4 py-3 text-sm uppercase outline-none dark:border-white/10"
                  placeholder="WELCOME10"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                >
                  Apply
                </button>
              </div>

              {useLocalPreviewData ? (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-white/50">Best offers for your cart</p>
                    {bestCoupon && coupon?.code !== bestCoupon.code ? (
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(bestCoupon.code)}
                        className="rounded-full bg-olive/10 px-3 py-1.5 text-xs font-semibold text-olive transition hover:bg-olive hover:text-white"
                      >
                        Apply best
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {couponOffers.map((offer) => {
                      const applied = coupon?.code === offer.code;
                      return (
                        <button
                          key={offer.code}
                          type="button"
                          onClick={() => handleApplyCoupon(offer.code)}
                          className={`w-full rounded-[1.35rem] border p-3 text-left transition hover:-translate-y-0.5 ${
                            applied
                              ? "border-olive bg-olive/10"
                              : offer.eligible
                                ? "border-ink/10 bg-white/50 dark:border-white/10 dark:bg-white/5"
                                : "border-dashed border-ink/15 bg-white/30 opacity-85 dark:border-white/15 dark:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`${offer.theme} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-black`}>
                              {offer.type === "percentage" ? `${offer.value}%` : "FLAT"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-display text-xl leading-none">{offer.code}</p>
                                {bestCoupon?.code === offer.code && offer.eligible ? (
                                  <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white dark:bg-white dark:text-ink">
                                    Best value
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs leading-5 text-ink/60 dark:text-white/60">{offer.label}</p>
                              <p className="text-[11px] font-semibold text-ink/45 dark:text-white/45">{offer.highlight}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                applied
                                  ? "bg-olive text-white"
                                  : offer.eligible
                                    ? "bg-olive/10 text-olive"
                                    : "bg-ink/5 text-ink/55 dark:bg-white/10 dark:text-white/60"
                              }`}
                              >
                                {applied
                                  ? "Applied"
                                  : offer.eligible
                                    ? `Save ${currency(offer.saving)}`
                                    : `${currency(offer.remaining)} more`}
                              </span>
                              <p className="mt-1 text-[11px] text-ink/40 dark:text-white/40">Min {currency(offer.minOrderAmount)}</p>
                            </div>
                          </div>
                          {!offer.eligible ? (
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                              <span
                                className="block h-full rounded-full bg-olive"
                                style={{ width: `${Math.min(100, (subtotal / offer.minOrderAmount) * 100)}%` }}
                              />
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {coupon?.code ? (
                    <div className="mt-4 rounded-[1.3rem] bg-olive px-4 py-3 text-sm font-semibold text-white">
                      <div className="flex items-center justify-between gap-3">
                        <span>{coupon.code} applied</span>
                        <span>You saved {currency(coupon.discountAmount)}</span>
                      </div>
                      {coupon.label ? <p className="mt-1 text-xs text-white/75">{coupon.label}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-ink/55 dark:text-white/55">
              {subtotal >= 2499 ? "You unlocked free shipping." : `Add ${currency(2499 - subtotal)} more for free shipping.`}
            </p>
            <div className="mt-6 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{currency(total)}</span>
            </div>
            <Link to="/checkout" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-olive px-5 py-4 text-sm font-semibold text-white">
              Proceed to checkout
              <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CartPage;
