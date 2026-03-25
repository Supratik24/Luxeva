import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Meta from "../components/ui/Meta";
import { useShop } from "../contexts/ShopContext";
import { currency } from "../utils/format";

const CartPage = () => {
  const { cart, coupon, updateQuantity, removeFromCart, applyCoupon } = useShop();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 250 ? 0 : 18;
  const tax = subtotal * 0.12;
  const total = subtotal + shipping + tax - (coupon?.discountAmount || 0);

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
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/15 p-4 dark:border-white/15">
              <p className="mb-3 text-sm font-semibold">Apply coupon</p>
              <div className="flex gap-2">
                <input id="coupon-code" className="w-full rounded-full border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="LUXE10" />
                <button
                  type="button"
                  onClick={() => applyCoupon(document.getElementById("coupon-code")?.value)}
                  className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                >
                  Apply
                </button>
              </div>
            </div>
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
