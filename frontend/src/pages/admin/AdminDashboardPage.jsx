import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Layers
} from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";
import { useTheme } from "../../contexts/ThemeContext";

const STATUS_CONFIG = [
  { key: "placed", label: "Placed", pillClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { key: "packed", label: "Packed", pillClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  { key: "shipped", label: "Shipped", pillClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { key: "out_for_delivery", label: "Out for Delivery", pillClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { key: "delivered", label: "Delivered", pillClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { key: "cancelled", label: "Cancelled", pillClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" }
];

const CustomChartTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDark = theme === "dark";
    return (
      <div
        className={`rounded-2xl p-4 shadow-xl backdrop-blur-md border transition-all ${
          isDark
            ? "bg-[#1f1f1f]/95 border-white/10 text-white shadow-black/60"
            : "bg-white/95 border-ink/10 text-ink shadow-slate-300/50"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-clay dark:text-white/50">{label}</p>
        <p className="mt-1 text-lg font-bold">{currency(data.sales || 0)}</p>
        <p className="text-xs text-clay dark:text-white/60 mt-0.5">
          {data.orders || 0} {data.orders === 1 ? "order" : "orders"} placed
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboardPage = () => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    orders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    monthlySales: []
  });
  const [lowStock, setLowStock] = useState([]);
  const [stockMeta, setStockMeta] = useState({ totalProducts: 0, lowStockCount: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chartColors = useMemo(() => {
    const isDark = theme === "dark";
    return {
      stroke: isDark ? "#ffffff" : "#151515",
      gradientStart: isDark ? "#ffffff" : "#151515",
      gradientStartOpacity: isDark ? 0.35 : 0.15,
      gradientEndOpacity: 0.01,
      gridStroke: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      tickFill: isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(21, 21, 21, 0.55)"
    };
  }, [theme]);

  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, stockRes, notificationsRes] = await Promise.allSettled([
        api.get(endpoints.orders.adminAnalytics),
        api.get(endpoints.catalog.lowStock),
        api.get(endpoints.notifications.admin)
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data?.analytics) {
        setAnalytics(analyticsRes.value.data.analytics);
      } else if (analyticsRes.status === "rejected") {
        console.warn("Analytics API unavailable:", analyticsRes.reason?.message);
      }

      if (stockRes.status === "fulfilled") {
        const prodData = stockRes.value.data?.products || [];
        setLowStock(prodData);
        setStockMeta({
          totalProducts: stockRes.value.data?.totalProducts || 0,
          lowStockCount: stockRes.value.data?.lowStockCount ?? prodData.length
        });
      } else if (stockRes.status === "rejected") {
        console.warn("Low stock API unavailable:", stockRes.reason?.message);
      }

      if (notificationsRes.status === "fulfilled") {
        setNotifications(notificationsRes.value.data?.notifications || []);
      } else if (notificationsRes.status === "rejected") {
        console.warn("Admin notifications API unavailable:", notificationsRes.reason?.message);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to refresh some operations data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(false);
  }, []);

  const totalActivePipeline =
    analytics.activeOrders ||
    ["placed", "packed", "shipped", "out_for_delivery"].reduce(
      (sum, key) => sum + (analytics.statusBreakdown?.[key] || 0),
      0
    );

  const kpiCards = [
    {
      label: "Total Net Revenue",
      value: currency(analytics.revenue || 0),
      subtext: "Fulfilled & active orders",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bgIcon: "bg-emerald-500/10 dark:bg-emerald-500/20"
    },
    {
      label: "Total Orders",
      value: analytics.orders || 0,
      subtext: `${analytics.deliveredOrders || 0} delivered • ${analytics.cancelledOrders || 0} cancelled`,
      icon: ShoppingBag,
      color: "text-blue-600 dark:text-blue-400",
      bgIcon: "bg-blue-500/10 dark:bg-blue-500/20"
    },
    {
      label: "Average Order Value",
      value: currency(analytics.averageOrderValue || 0),
      subtext: "Per successful checkout",
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bgIcon: "bg-amber-500/10 dark:bg-amber-500/20"
    },
    {
      label: "Active Transit Pipeline",
      value: totalActivePipeline,
      subtext: "Orders awaiting or in transit",
      icon: Truck,
      color: "text-purple-600 dark:text-purple-400",
      bgIcon: "bg-purple-500/10 dark:bg-purple-500/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Title and Quick Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Telemetry
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink dark:text-white lg:text-5xl">
            Operations overview
          </h1>
          <p className="mt-1 text-sm text-clay dark:text-white/60">
            Real-time fulfillment metrics, sales velocity, catalog inventory, and operational milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-ink/5 disabled:opacity-50 dark:border-white/12 dark:bg-[#222222] dark:text-white dark:hover:bg-white/5"
            title="Refresh Operations Data"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh Data"}</span>
          </button>

          <Link
            to="/portal/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ink/80 dark:bg-white dark:text-ink dark:hover:bg-white/90"
          >
            <span>Manage Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Top 4 Operational KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card transition hover:shadow-soft dark:border-white/12 dark:bg-[#222222]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/55">
                  {card.label}
                </p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.bgIcon}`}>
                  <Icon size={18} className={card.color} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-ink dark:text-white">
                {loading ? "..." : card.value}
              </p>
              <p className="mt-1 text-xs text-clay dark:text-white/50">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Order Fulfillment Distribution Pipeline */}
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink dark:text-white">Fulfillment Pipeline Status</h2>
            <p className="text-xs text-clay dark:text-white/50">Current volume of orders in each milestone stage</p>
          </div>
          <Link
            to="/portal/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline dark:text-white/80"
          >
            <span>View Orders Table</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_CONFIG.map((status) => {
            const count = analytics.statusBreakdown?.[status.key] || 0;
            return (
              <div
                key={status.key}
                className={`rounded-2xl border p-4 transition ${status.pillClass}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{status.label}</p>
                <p className="mt-2 text-2xl font-bold">{loading ? "..." : count}</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  {count === 1 ? "1 order" : `${count} orders`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Sales Velocity Chart & Low-Stock Alerts */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Sales Chart */}
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink dark:text-white">Sales & Volume Velocity</h2>
              <p className="text-xs text-clay dark:text-white/50">6-month revenue progression and checkout volume</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink dark:bg-white/10 dark:text-white">
                <Sparkles size={12} />
                <span>6 Months Rolling</span>
              </span>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-clay">Loading chart data...</div>
            ) : analytics.monthlySales && analytics.monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.gradientStart} stopOpacity={chartColors.gradientStartOpacity} />
                      <stop offset="95%" stopColor={chartColors.gradientStart} stopOpacity={chartColors.gradientEndOpacity} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: chartColors.tickFill, fontSize: 12 }}
                    axisLine={{ stroke: chartColors.gridStroke }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                  />
                  <Tooltip content={<CustomChartTooltip theme={theme} />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={chartColors.stroke}
                    strokeWidth={2.5}
                    fill="url(#salesGradient)"
                    dot={{ r: 3, fill: chartColors.stroke, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: chartColors.stroke, stroke: theme === "dark" ? "#222" : "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-ink/10 dark:border-white/10">
                <TrendingUp size={28} className="text-clay/40" />
                <p className="mt-2 text-xs font-semibold text-clay dark:text-white/60">No sales records to plot yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low-Stock & Inventory Health */}
        <div className="flex flex-col justify-between rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink dark:text-white">Inventory & Stock Alerts</h2>
                <p className="text-xs text-clay dark:text-white/50">Items below threshold (10 units)</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  lowStock.length > 0
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {lowStock.length > 0 ? (
                  <>
                    <AlertTriangle size={12} />
                    <span>{lowStock.length} Low Stock</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={12} />
                    <span>Healthy</span>
                  </>
                )}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="py-8 text-center text-xs text-clay">Checking inventory levels...</div>
              ) : lowStock.length > 0 ? (
                lowStock.slice(0, 5).map((product) => (
                  <div
                    key={product._id || product.sku}
                    className="flex items-center justify-between rounded-[1.3rem] border border-amber-500/20 bg-amber-500/5 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate font-semibold text-ink dark:text-white text-sm">{product.name}</p>
                      <p className="text-xs text-clay dark:text-white/60">SKU: {product.sku || "N/A"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                      {product.stock} left
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/5 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="mt-3 font-semibold text-emerald-950 dark:text-emerald-200">Inventory Status Healthy</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                    All catalog products have ample stock above the safety threshold (10 units).
                    {stockMeta.totalProducts ? ` (${stockMeta.totalProducts} active products in catalog)` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-ink/5 pt-4 dark:border-white/8">
            <Link
              to="/portal/admin/products"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-sand/50 px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-ink"
            >
              <span>Manage Catalog & Stock</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Milestone & Operations Notification Feed */}
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink dark:text-white">Admin Operations & Milestone Feed</h2>
            <p className="text-xs text-clay dark:text-white/50">Recent system actions, order state transitions, and milestone alerts</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-clay dark:bg-white/8 dark:text-white/60">
            <Bell size={12} />
            <span>{notifications.length} alerts</span>
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-clay">Loading activity feed...</div>
          ) : notifications.length > 0 ? (
            notifications.slice(0, 6).map((notification) => (
              <div
                key={notification._id}
                className="flex items-start gap-4 rounded-[1.3rem] bg-ink/5 p-4 transition hover:bg-ink/[0.08] dark:bg-white/8 dark:hover:bg-white/12"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                  <PackageCheck size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-ink dark:text-white">{notification.title}</p>
                    <span className="text-[11px] text-clay dark:text-white/45">
                      {notification.createdAt ? shortDate(notification.createdAt) : "Recent"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-clay dark:text-white/70 leading-relaxed">{notification.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-ink/10 p-8 text-center dark:border-white/10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-clay dark:bg-white/5 dark:text-white/40">
                <Bell size={18} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink dark:text-white">All clear</p>
              <p className="mt-1 text-xs text-clay dark:text-white/50">
                No pending system alerts or urgent milestone updates at this time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/portal/admin/orders"
          className="group flex items-center justify-between rounded-[1.6rem] border border-ink/10 bg-white p-5 shadow-card transition hover:border-ink/30 hover:shadow-soft dark:border-white/10 dark:bg-[#222222] dark:hover:border-white/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 text-ink dark:bg-white/10 dark:text-white group-hover:scale-105 transition-transform">
              <Truck size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink dark:text-white">Fulfillment & Orders</p>
              <p className="text-xs text-clay dark:text-white/50">Track & dispatch packages</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-clay group-hover:translate-x-1 transition-transform dark:text-white/40" />
        </Link>

        <Link
          to="/portal/admin/products"
          className="group flex items-center justify-between rounded-[1.6rem] border border-ink/10 bg-white p-5 shadow-card transition hover:border-ink/30 hover:shadow-soft dark:border-white/10 dark:bg-[#222222] dark:hover:border-white/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 text-ink dark:bg-white/10 dark:text-white group-hover:scale-105 transition-transform">
              <Layers size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink dark:text-white">Products & Inventory</p>
              <p className="text-xs text-clay dark:text-white/50">Manage stock & pricing</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-clay group-hover:translate-x-1 transition-transform dark:text-white/40" />
        </Link>

        <Link
          to="/portal/admin/users"
          className="group flex items-center justify-between rounded-[1.6rem] border border-ink/10 bg-white p-5 shadow-card transition hover:border-ink/30 hover:shadow-soft dark:border-white/10 dark:bg-[#222222] dark:hover:border-white/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 text-ink dark:bg-white/10 dark:text-white group-hover:scale-105 transition-transform">
              <PackageCheck size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink dark:text-white">Customer Accounts</p>
              <p className="text-xs text-clay dark:text-white/50">View user profiles & roles</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-clay group-hover:translate-x-1 transition-transform dark:text-white/40" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
