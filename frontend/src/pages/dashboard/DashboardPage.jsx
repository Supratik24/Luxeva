import { Bell, Heart, MapPinHouse, PackageCheck, UserRoundCog } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Meta from "../../components/ui/Meta";
import ProductCard from "../../components/ui/ProductCard";
import { mockProducts, useLocalPreviewData } from "../../data/mockStorefront";
import { useAuth } from "../../contexts/AuthContext";
import { useShop } from "../../contexts/ShopContext";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";
import { isPreviewAuthEnabled } from "../../utils/previewMode";

const tabs = [
  { key: "profile", label: "Profile", icon: UserRoundCog },
  { key: "orders", label: "Orders", icon: PackageCheck },
  { key: "addresses", label: "Addresses", icon: MapPinHouse },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "notifications", label: "Notifications", icon: Bell }
];

const emptyAddressForm = {
  label: "Home",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  phone: ""
};

const getVisibleOrderItems = (order) => {
  if (order.items?.length) {
    return order.items;
  }

  const fallbackProduct =
    mockProducts.find((product) => product.price <= (order.total || 0)) ||
    mockProducts[0];

  if (!fallbackProduct) {
    return [];
  }

  return [
    {
      productId: fallbackProduct._id,
      name: fallbackProduct.name,
      slug: fallbackProduct.slug,
      image: fallbackProduct.images?.[0]?.url,
      price: Math.min(fallbackProduct.price, order.total || fallbackProduct.price),
      quantity: 1,
      color: fallbackProduct.colors?.[0] || "Default",
      size: fallbackProduct.sizes?.[0] || "Standard",
      recoveredPreviewItem: true
    }
  ];
};

const DashboardPage = () => {
  const { user, updateProfile: saveProfile, addAddress, updateAddress, deleteAddress } = useAuth();
  const { wishlist, recentlyViewed } = useShop();
  const usePreviewAuth = useLocalPreviewData && isPreviewAuthEnabled;
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const orderRefreshAttempted = useRef("");

  const currentTab = searchParams.get("tab") || "profile";
  const highlightedOrder = searchParams.get("highlight") || "";

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || "",
      phone: user.phone || ""
    });
    setAddressForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      phone: current.phone || user.phone || ""
    }));

    if (usePreviewAuth) {
      setOrders(user.orders || []);
      setNotifications(user.notifications || []);
      setAddresses(user.addresses || []);
      return;
    }

    if (currentTab === "orders") {
      api
        .get(endpoints.orders.mine)
        .then(async ({ data }) => {
          const nextOrders = data.orders || [];

          if (
            highlightedOrder &&
            !nextOrders.some((order) => order._id === highlightedOrder) &&
            orderRefreshAttempted.current !== highlightedOrder
          ) {
            orderRefreshAttempted.current = highlightedOrder;
            await new Promise((resolve) => window.setTimeout(resolve, 700));
            const retryResponse = await api.get(endpoints.orders.mine);
            setOrders(retryResponse.data.orders || []);
            return;
          }

          setOrders(nextOrders);
        })
        .catch(() => setOrders([]));
    }

    if (currentTab === "notifications") {
      api
        .get(endpoints.notifications.mine)
        .then(({ data }) => setNotifications(data.notifications || []))
        .catch(() => setNotifications([]));
    }

    if (currentTab === "addresses") {
      if (user.addresses?.length) {
        setAddresses(user.addresses);
      }
      api.get(endpoints.auth.addresses).then(({ data }) => setAddresses(data.addresses || [])).catch(() => setAddresses(user.addresses || []));
    }
  }, [currentTab, usePreviewAuth, user]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    try {
      const data = await saveProfile(profile);
      if (data?.user) {
        setProfile({
          name: data.user.name || "",
          phone: data.user.phone || ""
        });
      }
      setProfileSuccess("Profile saved successfully.");
    } catch (error) {
      setProfileError(error?.response?.data?.message || "Profile save failed. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const updateAddressField = (key, value) => {
    setAddressError("");
    setAddressSuccess("");
    setAddressForm((current) => ({ ...current, [key]: value }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      ...emptyAddressForm,
      fullName: user?.name || "",
      phone: user?.phone || ""
    });
    setEditingAddressId("");
  };

  const openAddressEditor = (address) => {
    setAddressError("");
    setAddressSuccess("");
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      phone: address.phone || ""
    });
    setAddressFormOpen(true);
  };

  const submitAddress = async (event) => {
    event.preventDefault();
    setAddressError("");
    setAddressSuccess("");

    const requiredFields = ["fullName", "line1", "city", "state", "postalCode", "phone"];
    const missingField = requiredFields.find((field) => !String(addressForm[field] || "").trim());
    if (missingField) {
      setAddressError("Please complete all required address fields.");
      return;
    }

    setSavingAddress(true);
    try {
      const data = editingAddressId
        ? await updateAddress(editingAddressId, addressForm)
        : await addAddress(addressForm);
      setAddresses(data.addresses || [data.address, ...addresses]);
      resetAddressForm();
      setAddressFormOpen(false);
      setAddressSuccess(editingAddressId ? "Address updated successfully." : "Address saved successfully.");
    } catch (error) {
      setAddressError(error?.response?.data?.message || "Address save failed. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (addressId) => {
    setAddressError("");
    setAddressSuccess("");
    setSavingAddress(true);
    try {
      const data = await deleteAddress(addressId);
      setAddresses(data.addresses || []);
      if (editingAddressId === addressId) {
        resetAddressForm();
        setAddressFormOpen(false);
      }
      setAddressSuccess("Address deleted successfully.");
    } catch (error) {
      setAddressError(error?.response?.data?.message || "Address delete failed. Please try again.");
    } finally {
      setSavingAddress(false);
    }
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
          {orders.map((order) => {
            const visibleItems = getVisibleOrderItems(order);
            const totalQuantity = visibleItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const hasRecoveredItems = visibleItems.some((item) => item.recoveredPreviewItem);

            return (
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
                      {shortDate(order.createdAt)} | {totalQuantity || 1} item{totalQuantity > 1 ? "s" : ""}
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

                <div className="mt-5 rounded-[1.4rem] bg-ink/5 p-3 dark:bg-white/5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50 dark:text-white/50">Items ordered</p>
                    {hasRecoveredItems ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                        Older preview order
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {visibleItems.map((item) => (
                      <div key={`${order._id}-${item.productId}-${item.color}-${item.size}`} className="flex items-center gap-3 rounded-2xl bg-white/55 p-2 dark:bg-white/5">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80"}
                          alt={item.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-ink/50 dark:text-white/50">
                            Qty {item.quantity || 1} | {item.color || "Default"} | {item.size || "Standard"}
                          </p>
                          {item.recoveredPreviewItem ? (
                            <p className="mt-1 text-[11px] text-ink/45 dark:text-white/45">
                              This older preview order did not save exact line-items, so a preview item is shown.
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold">{currency((item.price || 0) * (item.quantity || 1))}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                  <div className="rounded-2xl border border-ink/10 p-3 dark:border-white/10">
                    <p className="text-xs text-ink/45 dark:text-white/45">Subtotal</p>
                    <p className="font-semibold">{currency(order.subtotal || order.total)}</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 p-3 dark:border-white/10">
                    <p className="text-xs text-ink/45 dark:text-white/45">Shipping</p>
                    <p className="font-semibold">{currency(order.shippingFee || 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 p-3 dark:border-white/10">
                    <p className="text-xs text-ink/45 dark:text-white/45">Tax</p>
                    <p className="font-semibold">{currency(order.tax || 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-ink/10 p-3 dark:border-white/10">
                    <p className="text-xs text-ink/45 dark:text-white/45">Total paid</p>
                    <p className="font-semibold">{currency(order.total)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (currentTab === "addresses") {
      return (
        <div className="space-y-5">
          <div className="rounded-[1.7rem] border border-ink/10 bg-white/45 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/45 dark:text-white/45">Address book</p>
                <h2 className="mt-2 font-display text-3xl">Delivery addresses</h2>
                <p className="mt-1 text-sm text-ink/55 dark:text-white/55">Add home, office, or gift delivery locations for faster checkout.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddressError("");
                  setAddressSuccess("");
                  if (addressFormOpen && !editingAddressId) {
                    setAddressFormOpen(false);
                    return;
                  }
                  resetAddressForm();
                  setAddressFormOpen(true);
                }}
                className="rounded-full bg-olive px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {addressFormOpen ? (editingAddressId ? "Cancel edit" : "Close form") : "Add address"}
              </button>
            </div>
            {addressSuccess ? <p className="mt-4 text-sm font-semibold text-olive">{addressSuccess}</p> : null}
            {addressError ? <p className="mt-2 text-sm font-semibold text-red-500">{addressError}</p> : null}

            {addressFormOpen ? (
              <form onSubmit={submitAddress} className="mt-6 grid gap-3 sm:grid-cols-2">
                <input value={addressForm.label} onChange={(event) => updateAddressField("label", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Label e.g. Home" />
                <input value={addressForm.fullName} onChange={(event) => updateAddressField("fullName", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Full name" />
                <input value={addressForm.line1} onChange={(event) => updateAddressField("line1", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2" placeholder="House / flat / street" />
                <input value={addressForm.line2} onChange={(event) => updateAddressField("line2", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2" placeholder="Landmark or area (optional)" />
                <input value={addressForm.city} onChange={(event) => updateAddressField("city", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="City" />
                <input value={addressForm.state} onChange={(event) => updateAddressField("state", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="State" />
                <input value={addressForm.postalCode} onChange={(event) => updateAddressField("postalCode", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="PIN code" />
                <input value={addressForm.phone} onChange={(event) => updateAddressField("phone", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Phone number" />
                <input value={addressForm.country} onChange={(event) => updateAddressField("country", event.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" placeholder="Country" />
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={savingAddress} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {savingAddress ? "Saving..." : editingAddressId ? "Update address" : "Save address"}
                  </button>
                  {editingAddressId ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetAddressForm();
                        setAddressFormOpen(false);
                      }}
                      className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </div>

          {!addresses.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-ink/15 p-8 text-center dark:border-white/15">
              <p className="font-semibold">No saved addresses yet</p>
              <p className="mt-2 text-muted">Tap Add address to save your first delivery location.</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div key={address._id} className="rounded-[1.5rem] border border-ink/10 bg-white/35 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{address.label || "Address"}</p>
                  <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold text-olive">{address.country || "India"}</span>
                </div>
                <p className="mt-3 font-semibold">{address.fullName}</p>
                <p className="mt-2 text-sm leading-6 text-ink/60 dark:text-white/60">
                  {[address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                </p>
                {address.phone ? <p className="mt-3 text-sm font-semibold text-ink/55 dark:text-white/55">Phone: {address.phone}</p> : null}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAddressEditor(address)}
                    className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold transition hover:border-olive hover:text-olive dark:border-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(address._id)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400/30 dark:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          <div className="flex items-center gap-3">
            <button type="submit" disabled={profileSaving} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {profileSaving ? "Saving..." : "Save profile"}
            </button>
            {profileError ? <p className="text-sm font-semibold text-red-500">{profileError}</p> : null}
            {profileSuccess ? <p className="text-sm font-semibold text-olive">{profileSuccess}</p> : null}
          </div>
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
  }, [addressError, addressForm, addressFormOpen, addressSuccess, addresses, currentTab, deleteAddress, editingAddressId, highlightedOrder, notifications, orders, profile, profileError, profileSaving, profileSuccess, recentlyViewed, saveProfile, savingAddress, updateAddress, wishlist]);

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
