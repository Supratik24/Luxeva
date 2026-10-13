import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Truck,
  Package,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle
} from "lucide-react";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";
import OrderTrackingTimeline from "../../components/orders/OrderTrackingTimeline";
import useOrderSocket from "../../hooks/useOrderSocket";

const STATUSES = [
  { key: "placed", label: "Placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" }
];

const CARRIER_PRESETS = [
  { name: "BlueDart", trackUrl: "https://www.bluedart.com/tracking" },
  { name: "Delhivery", trackUrl: "https://www.delhivery.com/track/package/" },
  { name: "DTDC", trackUrl: "https://www.dtdc.in/tracking.asp" },
  { name: "India Post", trackUrl: "https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/trackconsignment.aspx" },
  { name: "FedEx", trackUrl: "https://www.fedex.com/en-in/tracking.html" },
  { name: "Shadowfax", trackUrl: "https://tracker.shadowfax.in/" }
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editingShipping, setEditingShipping] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    return api
      .get(endpoints.orders.adminOrders)
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error("Failed to fetch admin orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Live order updates in admin via Socket.IO
  useOrderSocket({
    onUpdate: (data) => {
      if (!data?.orderId) return;
      setOrders((prev) =>
        prev.map((order) =>
          order._id === data.orderId
            ? {
                ...order,
                status: data.status,
                timeline: data.timeline || order.timeline,
                shipping: data.shipping || order.shipping
              }
            : order
        )
      );
    }
  });

  const handleQuickStatusChange = async (order, newStatus) => {
    const defaultMessages = {
      placed: "Order placed and confirmed",
      packed: "Package packed and ready for dispatch",
      shipped: "Package handed over to courier and in transit",
      out_for_delivery: "Package is out for delivery to your address",
      delivered: "Package delivered successfully",
      cancelled: "Order cancelled — any deducted amount will be refunded to your original payment method"
    };

    try {
      await api.patch(endpoints.orders.updateStatus(order._id), {
        status: newStatus,
        note: defaultMessages[newStatus] || `Package status updated to ${newStatus.replace(/_/g, " ")}`
      });
      toast.success(`Order #${order.orderNumber} marked as ${newStatus.replace(/_/g, " ")}`);
      await load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleOpenShippingForm = (order) => {
    if (editingShipping[order._id]) {
      setEditingShipping((prev) => ({ ...prev, [order._id]: null }));
      return;
    }

    const currentShipping = order.shipping || {};
    setEditingShipping((prev) => ({
      ...prev,
      [order._id]: {
        status: order.status,
        carrier: currentShipping.carrier || "BlueDart",
        trackingNumber: currentShipping.trackingNumber || "",
        trackingUrl: currentShipping.trackingUrl || "",
        location: "",
        note: "",
        estimatedDelivery: currentShipping.estimatedDelivery
          ? new Date(currentShipping.estimatedDelivery).toISOString().split("T")[0]
          : ""
      }
    }));
  };

  const handleCarrierSelect = (orderId, carrierName) => {
    const preset = CARRIER_PRESETS.find((c) => c.name === carrierName);
    setEditingShipping((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        carrier: carrierName,
        trackingUrl: preset ? preset.trackUrl : prev[orderId]?.trackingUrl || ""
      }
    }));
  };

  const handleSaveShipping = async (orderId) => {
    const formData = editingShipping[orderId];
    if (!formData) return;

    setSavingId(orderId);
    try {
      await api.patch(endpoints.orders.updateStatus(orderId), {
        status: formData.status,
        carrier: formData.carrier,
        trackingNumber: formData.trackingNumber,
        trackingUrl: formData.trackingUrl,
        location: formData.location,
        note: formData.note || `Package status: ${formData.status.replace(/_/g, " ")}`,
        estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery) : undefined
      });

      toast.success("Order & shipping details updated and pushed live! 🚀");
      setEditingShipping((prev) => ({ ...prev, [orderId]: null }));
      await load();
    } catch {
      toast.error("Failed to save shipping update");
    } finally {
      setSavingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber?.toLowerCase().includes(q);
      const matchCustomer = order.customer?.name?.toLowerCase().includes(q);
      const matchEmail = order.customer?.email?.toLowerCase().includes(q);
      const matchTracking = order.shipping?.trackingNumber?.toLowerCase().includes(q);
      if (!matchNumber && !matchCustomer && !matchEmail && !matchTracking) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="eyebrow">Admin Portal</span>
        <h1 className="mt-2 font-display text-4xl font-semibold dark:text-white">
          Order Management & Live Tracking
        </h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
          Update shipping carriers, tracking numbers, and stage milestones in real-time. Changes are pushed live to customer devices.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-full border border-ink/10 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-ink text-white dark:bg-white dark:text-ink"
                : "text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
            }`}
          >
            All ({orders.length})
          </button>
          {STATUSES.map((st) => {
            const count = orders.filter((o) => o.status === st.key).length;
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st.key
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {st.label} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-white/40" />
          <input
            type="text"
            placeholder="Search order #, customer, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-ink/10 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-ink dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-card dark:border-white/10 dark:bg-[#1a1a1a]">
            <p className="font-display text-xl font-semibold">No orders found</p>
            <p className="mt-1 text-sm text-ink/50 dark:text-white/50">
              Try adjusting your status filter or search query.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isShippingOpen = !!editingShipping[order._id];
            const shippingForm = editingShipping[order._id] || {};
            const isTrackingExpanded = expandedOrder === order._id;

            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-card transition-all dark:border-white/12 dark:bg-[#222222]"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-lg font-semibold dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          order.status === "delivered"
                            ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                            : order.status === "cancelled"
                            ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                            : order.status === "out_for_delivery"
                            ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                            : "bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {order.status?.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-ink/55 dark:text-white/60">
                      Customer: <strong className="text-ink dark:text-white">{order.customer?.name || "Guest"}</strong> ({order.customer?.email}) | Placed: {shortDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-ink dark:text-white">{currency(order.total)}</p>

                    {/* Quick status dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => handleQuickStatusChange(order, e.target.value)}
                      className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-semibold outline-none transition focus:border-ink dark:border-white/15 dark:bg-[#2a2d3a] dark:text-white"
                    >
                      {STATUSES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>

                    {/* Manage Shipping Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenShippingForm(order)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        isShippingOpen
                          ? "bg-ink text-white dark:bg-white dark:text-ink"
                          : "border border-ink/10 hover:border-ink/30 dark:border-white/10 dark:hover:border-white/30"
                      }`}
                    >
                      <Truck size={13} />
                      {isShippingOpen ? "Close Shipping" : "Update Shipping"}
                    </button>

                    {/* Toggle User View Preview */}
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(isTrackingExpanded ? null : order._id)}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/10 p-2 text-xs text-ink/60 transition hover:bg-ink/5 dark:border-white/10 dark:text-white/60"
                      title={isTrackingExpanded ? "Hide live tracking timeline" : "View live tracking timeline"}
                    >
                      {isTrackingExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Items & Shipping Snapshot Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3 text-xs text-ink/60 dark:border-white/5 dark:text-white/60">
                  <p>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""} | Delivery to: {order.shippingAddress?.city || "India"}, {order.shippingAddress?.state} ({order.shippingAddress?.postalCode})
                  </p>

                  {order.shipping?.trackingNumber && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink dark:text-white">
                        🚚 {order.shipping.carrier}:
                      </span>
                      <span className="font-mono">{order.shipping.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Manage Shipping Drawer Form */}
                {isShippingOpen && (
                  <div className="mt-5 rounded-2xl border border-ink/10 bg-ink/5 p-5 dark:border-white/10 dark:bg-white/5">
                    <p className="font-semibold text-sm text-ink dark:text-white">
                      Update Live Shipping & Tracking Details
                    </p>
                    <p className="text-xs text-ink/50 dark:text-white/40 mt-0.5">
                      Submitting this form immediately updates the timeline and pushes real-time WebSocket notifications to the customer's portal.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Status */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Delivery Status Stage *
                        </label>
                        <select
                          value={shippingForm.status}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], status: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        >
                          {STATUSES.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Courier Presets */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Courier / Carrier
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={shippingForm.carrier}
                            onChange={(e) => handleCarrierSelect(order._id, e.target.value)}
                            className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                          >
                            {CARRIER_PRESETS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                            <option value="Custom">Other / Custom</option>
                          </select>
                        </div>
                      </div>

                      {/* Tracking Number */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Tracking Number (AWB / Consignment)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BD987654321IN"
                          value={shippingForm.trackingNumber}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], trackingNumber: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs font-mono outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        />
                      </div>

                      {/* Current Location */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Current Location (Milestone)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mumbai Sorting Facility"
                          value={shippingForm.location}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], location: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        />
                      </div>

                      {/* Status Note / Description */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Status Message / Customer Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Package arrived at local delivery hub"
                          value={shippingForm.note}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], note: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        />
                      </div>

                      {/* Estimated Delivery Date */}
                      <div>
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Estimated Delivery Date
                        </label>
                        <input
                          type="date"
                          value={shippingForm.estimatedDelivery}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], estimatedDelivery: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        />
                      </div>

                      {/* External Tracking URL */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold text-ink/70 dark:text-white/70 mb-1">
                          Direct Courier Tracking Web Link
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.bluedart.com/tracking..."
                          value={shippingForm.trackingUrl}
                          onChange={(e) =>
                            setEditingShipping((prev) => ({
                              ...prev,
                              [order._id]: { ...prev[order._id], trackingUrl: e.target.value }
                            }))
                          }
                          className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingShipping((prev) => ({ ...prev, [order._id]: null }))}
                        className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink/70 transition hover:bg-ink/5 dark:border-white/10 dark:text-white/70"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingId === order._id}
                        onClick={() => handleSaveShipping(order._id)}
                        className="btn-primary inline-flex items-center gap-2 py-2 px-5 text-xs"
                      >
                        <Send size={13} />
                        {savingId === order._id ? "Pushing Live..." : "Save & Push Live Update"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer View Timeline Preview */}
                {isTrackingExpanded && (
                  <div className="mt-6 border-t border-ink/10 pt-5 dark:border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 dark:text-white/40 mb-2">
                      Customer View Live Preview
                    </p>
                    <OrderTrackingTimeline order={order} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
