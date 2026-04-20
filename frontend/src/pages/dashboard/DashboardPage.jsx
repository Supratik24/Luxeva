import { Bell, Heart, MapPinHouse, PackageCheck, UserRoundCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Meta from "../../components/ui/Meta";
import ProductCard from "../../components/ui/ProductCard";
import { useLocalPreviewData } from "../../data/mockStorefront";
import { useAuth } from "../../contexts/AuthContext";
import { useShop } from "../../contexts/ShopContext";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";

const tabs = [
  { key: "profile", label: "Profile", icon: UserRoundCog },
  { key: "orders", label: "Orders", icon: PackageCheck },
  { key: "addresses", label: "Addresses", icon: MapPinHouse },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "notifications", label: "Notifications", icon: Bell }
];

const DashboardPage = () => {
  const { user, updateProfile: saveProfile } = useAuth();
  const { wishlist, recentlyViewed } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: "", phone: "", avatar: "" });

  const currentTab = searchParams.get("tab") || "profile";
  const highlightedOrder = searchParams.get("highlight") || "";

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || "",
      phone: user.phone || "",
      avatar: user.avatar || ""
    });

    if (useLocalPreviewData) {
      setOrders(user.orders || []);
      setNotifications(user.notifications || []);
      setAddresses(user.addresses || []);
      return;
    }

    api.get(endpoints.orders.mine).then(({ data }) => setOrders(data.orders || [])).catch(() => setOrders([]));
    api
      .get(endpoints.notifications.mine)
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch(() => setNotifications([]));
    api.get(endpoints.auth.addresses).then(({ data }) => setAddresses(data.addresses || [])).catch(() => setAddresses([]));
  }, [user]);

  const updateProfile = async (event) => {
    event.preventDefault();
    await saveProfile(profile);
  };

  const content = useMemo(() => {
    if (currentTab === "orders") {
      return (
        <div className="space-y-4">
          {!orders.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-ink/15 p-8 text-center dark:border-white/15">
              <p className="font-semibold">No orders yet</p>
              <p className="mt-2 text-muted">Your placed orders will appear here after checkout.</p>
            </div>
          ) : null}
          {orders.map((order) => (
            <div
              key={order._id}
              className={`rounded-[1.5rem] border p-5 transition ${
                highlightedOrder === order._id
                  ? "border-olive bg-olive/10"
                  : "border-ink/10 dark:border-white/10"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-ink/50 dark:text-white/50">
                    {shortDate(order.createdAt)} {order.items?.length ? `| ${order.items.length} item${order.items.length > 1 ? "s" : ""}` : ""}
                  </p>
                  {order.coupon?.code ? (
                    <p className="mt-2 inline-flex rounded-full bg-olive px-3 py-1 text-xs font-semibold text-white">
                      {order.coupon.code} saved {currency(order.coupon.discountAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-semibold capitalize">{order.status}</p>
                  <p className="text-sm text-ink/50 dark:text-white/50">{currency(order.total)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (currentTab === "addresses") {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address._id} className="rounded-[1.5rem] border border-ink/10 p-5 dark:border-white/10">
              <p className="font-semibold">{address.label}</p>
              <p className="mt-3 text-muted">
                {address.fullName}, {address.line1}, {address.city}, {address.state}, {address.postalCode}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (currentTab === "wishlist") {
      return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} compact />
          ))}
        </div>
      );
    }

    if (currentTab === "notifications") {
      return (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification._id} className="rounded-[1.5rem] border border-ink/10 p-5 dark:border-white/10">
              <p className="font-semibold">{notification.title}</p>
              <p className="mt-2 text-muted">{notification.message}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={updateProfile} className="space-y-4">
          <input value={profile.name} onChange={(e) => setProfile((s) => ({ ...s, name: e.target.value }))} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Name" />
          <input value={profile.phone} onChange={(e) => setProfile((s) => ({ ...s, phone: e.target.value }))} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Phone" />
          <input value={profile.avatar} onChange={(e) => setProfile((s) => ({ ...s, avatar: e.target.value }))} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Avatar URL" />
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Save profile</button>
        </form>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">Recently viewed</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {recentlyViewed.map((product) => (
              <ProductCard key={product._id} product={product} compact />
            ))}
          </div>
        </div>
      </div>
    );
  }, [addresses, currentTab, highlightedOrder, notifications, orders, profile, recentlyViewed, saveProfile, wishlist]);

  return (
    <section className="section-shell py-12">
      <Meta title="Dashboard" description="Manage your account, orders, and saved items." />
      <div className="mb-10">
        <p className="eyebrow">My account</p>
        <h1 className="mt-3 font-display text-5xl">Welcome back, {user?.name?.split(" ")[0]}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="glass h-fit rounded-[2rem] p-4 shadow-soft">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSearchParams({ tab: tab.key })}
                className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                  currentTab === tab.key ? "bg-ink text-white" : ""
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </aside>
        <div className="glass rounded-[2rem] p-6 shadow-soft">{content}</div>
      </div>
    </section>
  );
};

export default DashboardPage;
