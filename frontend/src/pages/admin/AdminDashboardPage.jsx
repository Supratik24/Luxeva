import { useEffect, useState, useMemo, useRef } from "react";
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
  Sparkles,
  Layers,
  Calendar,
  Download,
  AlertOctagon,
  Percent,
  ChevronDown,
  DollarSign,
  Award,
  ArrowUpRight,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Check,
  Mail,
  Send,
  Users,
  Trash2,
  X,
  Search,
  Megaphone
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7D", label: "7 Days" },
  { key: "30D", label: "30 Days" },
  { key: "month", label: "This Month" },
  { key: "90D", label: "90 Days" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" }
];

const FALLBACK_CATALOG_PRODUCTS = [
  { _id: "p_silk_kurta", name: "Handcrafted Silk Kurta", sku: "LX-SK-01", price: 2999, stock: 18, category: { name: "Ethnic Wear" } },
  { _id: "p_watch", name: "Analog Minimalist Watch", sku: "LX-WT-02", price: 4299, stock: 12, category: { name: "Watches" } },
  { _id: "p_scarf", name: "Pure Mulberry Silk Scarf", sku: "LX-SF-03", price: 1899, stock: 6, category: { name: "Accessories" } },
  { _id: "p_loafers", name: "Leather Formal Loafers", sku: "LX-LF-04", price: 3499, stock: 8, category: { name: "Footwear" } },
  { _id: "p_cashmere_coat", name: "Cashmere Wool Overcoat", sku: "LX-CW-05", price: 8999, stock: 4, category: { name: "Apparel" } },
  { _id: "p_silk_gown", name: "Silk Evening Gown", sku: "LX-SG-06", price: 5499, stock: 0, category: { name: "Dresses" } },
  { _id: "p_gold_cufflinks", name: "Vintage 24K Gold Cufflinks", sku: "LX-CL-07", price: 6499, stock: 25, category: { name: "Jewelry" } },
  { _id: "p_linen_blazer", name: "Handwoven Italian Linen Blazer", sku: "LX-BZ-08", price: 7999, stock: 19, category: { name: "Apparel" } }
];

const getDateBounds = (preset, customStart, customEnd) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(0);

  if (preset === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (preset === "7D") {
    start = new Date(now.getTime() - 7 * 86400000);
  } else if (preset === "30D") {
    start = new Date(now.getTime() - 30 * 86400000);
  } else if (preset === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (preset === "90D") {
    start = new Date(now.getTime() - 90 * 86400000);
  } else if (preset === "all") {
    start = new Date(0);
  } else if (preset === "custom") {
    if (customStart) {
      const cs = new Date(customStart);
      start = new Date(cs.getFullYear(), cs.getMonth(), cs.getDate(), 0, 0, 0, 0);
    }
    if (customEnd) {
      const ce = new Date(customEnd);
      end.setTime(new Date(ce.getFullYear(), ce.getMonth(), ce.getDate(), 23, 59, 59, 999).getTime());
    }
  }

  return { start, end };
};

const CustomChartTooltip = ({ active, payload, label, theme, metricMode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDark = theme === "dark";
    return (
      <div
        className={`min-w-[190px] rounded-2xl p-4 shadow-xl backdrop-blur-md border transition-all ${
          isDark
            ? "bg-[#1f1f1f]/95 border-white/10 text-white shadow-black/60"
            : "bg-white/95 border-ink/10 text-ink shadow-slate-300/50"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-clay dark:text-white/50">{label}</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-clay dark:text-white/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Revenue:
            </span>
            <span className="font-bold text-ink dark:text-white">{currency(data.sales || 0)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-clay dark:text-white/60">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Est. Profit (38%):
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {currency(data.profit || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-ink/5 dark:border-white/5">
            <span className="flex items-center gap-1.5 text-clay dark:text-white/60">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Orders Volume:
            </span>
            <span className="font-semibold text-ink dark:text-white">
              {data.orders || 0} {data.orders === 1 ? "order" : "orders"}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AdminDashboardPage = () => {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    estimatedProfit: 0,
    orders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    cancellationRate: 0,
    lostRevenue: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    monthlySales: []
  });
  const [allOrders, setAllOrders] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stockMeta, setStockMeta] = useState({ totalProducts: 0, lowStockCount: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date Range Filter State
  const [dateRange, setDateRange] = useState("30D");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");

  // Chart Metric Switcher State ("all" | "revenue" | "profit" | "orders")
  const [chartMetric, setChartMetric] = useState("all");

  // Product Performance Tab State ("best" | "low")
  const [productTab, setProductTab] = useState("best");
  const [productSearch, setProductSearch] = useState("");

  // Export Dropdown State
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormatTab, setExportFormatTab] = useState("pdf"); // "pdf" | "csv"
  const exportRef = useRef(null);

  // Newsletter Audience & Broadcast State
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    title: "",
    message: "",
    category: "private_drop",
    actionUrl: "/shop",
    actionText: "Explore Collection"
  });

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartColors = useMemo(() => {
    const isDark = theme === "dark";
    return {
      revenueStroke: "#10b981",
      revenueFill: "#10b981",
      profitStroke: isDark ? "#818cf8" : "#6366f1",
      profitFill: isDark ? "#818cf8" : "#6366f1",
      ordersStroke: "#0ea5e9",
      ordersFill: "#0ea5e9",
      gridStroke: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      tickFill: isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(21, 21, 21, 0.55)"
    };
  }, [theme]);

  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        analyticsRes,
        ordersRes,
        stockRes,
        notificationsRes,
        productsRes,
        subscribersRes,
        campaignsRes
      ] = await Promise.allSettled([
        api.get(endpoints.orders.adminAnalytics),
        api.get(endpoints.orders.adminOrders),
        api.get(endpoints.catalog.lowStock),
        api.get(endpoints.notifications.admin),
        api.get(endpoints.catalog.products, { params: { limit: 100 } }),
        api.get(endpoints.content.adminSubscribers),
        api.get(endpoints.content.adminCampaigns)
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data?.analytics) {
        setAnalytics(analyticsRes.value.data.analytics);
      }

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data?.orders)) {
        setAllOrders(ordersRes.value.data.orders);
      }

      if (stockRes.status === "fulfilled") {
        const prodData = stockRes.value.data?.products || [];
        setLowStock(prodData);
        setStockMeta({
          totalProducts: stockRes.value.data?.totalProducts || 0,
          lowStockCount: stockRes.value.data?.lowStockCount ?? prodData.length
        });
      }

      if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value?.data?.products)) {
        setCatalogProducts(productsRes.value.data.products);
      }

      if (notificationsRes.status === "fulfilled") {
        setNotifications(notificationsRes.value.data?.notifications || []);
      }

      if (subscribersRes.status === "fulfilled") {
        const subs =
          subscribersRes.value?.data?.data?.subscribers ||
          subscribersRes.value?.data?.subscribers ||
          [];
        setSubscribers(subs);
      }

      if (campaignsRes.status === "fulfilled") {
        const camps =
          campaignsRes.value?.data?.data?.campaigns ||
          campaignsRes.value?.data?.campaigns ||
          [];
        setCampaigns(camps);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to refresh some operations data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const activeSubscribersCount = useMemo(() => {
    return subscribers.filter((s) => s.status === "subscribed").length;
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    if (!subscriberSearch.trim()) return subscribers;
    const term = subscriberSearch.toLowerCase();
    return subscribers.filter((s) => s.email?.toLowerCase().includes(term));
  }, [subscribers, subscriberSearch]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.subject.trim() || !broadcastForm.message.trim()) {
      toast.error("Subject and campaign message are required.");
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await api.post(endpoints.content.adminSendCampaign, broadcastForm);
      const data = res.data?.data || res.data || {};
      toast.success(
        res.data?.message ||
          `Broadcast sent to ${data.recipientCount || subscribers.length} subscribers!`
      );
      setBroadcastModalOpen(false);
      setBroadcastForm({
        subject: "",
        title: "",
        message: "",
        category: "private_drop",
        actionUrl: "/shop",
        actionText: "Explore Collection"
      });

      // Refresh campaigns list
      const campsRes = await api.get(endpoints.content.adminCampaigns);
      const updatedCamps =
        campsRes.data?.data?.campaigns || campsRes.data?.campaigns || [];
      setCampaigns(updatedCamps);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch broadcast campaign");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the newsletter subscriber list?`)) return;
    try {
      await api.delete(endpoints.content.adminDeleteSubscriber(id));
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
      toast.success(`Removed ${email}`);
    } catch (err) {
      toast.error("Failed to remove subscriber");
    }
  };

  useEffect(() => {
    loadDashboardData(false);
  }, []);

  // Compute active date boundaries
  const activeDateBounds = useMemo(() => {
    return getDateBounds(dateRange, appliedCustomStart, appliedCustomEnd);
  }, [dateRange, appliedCustomStart, appliedCustomEnd]);

  // Compute filtered orders based on selected date range
  const filteredOrders = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return [];
    const { start, end } = activeDateBounds;
    const startMs = start.getTime();
    const endMs = end.getTime();

    return allOrders.filter((order) => {
      const t = new Date(order.createdAt || Date.now()).getTime();
      return t >= startMs && t <= endMs;
    });
  }, [allOrders, activeDateBounds]);

  // Dynamic Metrics calculated in real time from filtered orders
  const metrics = useMemo(() => {
    if (allOrders.length === 0) {
      return {
        revenue: analytics.revenue || 0,
        estimatedProfit: analytics.estimatedProfit || Number(((analytics.revenue || 0) * 0.38).toFixed(2)),
        orders: analytics.orders || 0,
        deliveredOrders: analytics.deliveredOrders || 0,
        cancelledOrders: analytics.cancelledOrders || 0,
        cancellationRate: analytics.cancellationRate || 0,
        lostRevenue: analytics.lostRevenue || 0,
        averageOrderValue: analytics.averageOrderValue || 0,
        activeOrders: analytics.activeOrders || 0,
        statusBreakdown: analytics.statusBreakdown || {}
      };
    }

    const validOrders = filteredOrders.filter((o) => o.status !== "cancelled");
    const cancelledList = filteredOrders.filter((o) => o.status === "cancelled");
    const revenue = Number(validOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));
    const estimatedProfit = Number((revenue * 0.38).toFixed(2));
    const lostRevenue = Number(cancelledList.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2));
    const totalOrdersCount = filteredOrders.length;
    const cancellationRate = totalOrdersCount > 0
      ? Number(((cancelledList.length / totalOrdersCount) * 100).toFixed(1))
      : 0;
    const averageOrderValue = validOrders.length > 0
      ? Number((revenue / validOrders.length).toFixed(2))
      : 0;

    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const activeOrders = filteredOrders.filter((o) =>
      ["placed", "packed", "shipped", "out_for_delivery"].includes(o.status)
    ).length;
    const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered").length;

    return {
      revenue,
      estimatedProfit,
      orders: totalOrdersCount,
      deliveredOrders,
      cancelledOrders: cancelledList.length,
      cancellationRate,
      lostRevenue,
      averageOrderValue,
      activeOrders,
      statusBreakdown
    };
  }, [allOrders, filteredOrders, analytics]);

  // Dynamic Trend Series (Daily or Monthly buckets)
  const trendData = useMemo(() => {
    const { start, end } = activeDateBounds;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 35 && dateRange !== "all") {
      // Daily Buckets
      const daysMap = new Map();
      const curr = new Date(start);
      curr.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const key = curr.toISOString().split("T")[0];
        const label = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        daysMap.set(key, { label, sales: 0, profit: 0, orders: 0 });
        curr.setDate(curr.getDate() + 1);
      }

      filteredOrders.forEach((order) => {
        if (order.status === "cancelled") return;
        const d = new Date(order.createdAt || Date.now());
        const key = d.toISOString().split("T")[0];
        if (daysMap.has(key)) {
          const item = daysMap.get(key);
          item.sales = Number((item.sales + (order.total || 0)).toFixed(2));
          item.profit = Number((item.sales * 0.38).toFixed(2));
          item.orders += 1;
        }
      });

      return Array.from(daysMap.values());
    } else {
      // Monthly Buckets
      const monthsMap = new Map();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString("en-US", { month: "short" });
        monthsMap.set(key, { label, sales: 0, profit: 0, orders: 0 });
      }

      filteredOrders.forEach((order) => {
        if (order.status === "cancelled") return;
        const d = new Date(order.createdAt || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthsMap.has(key)) {
          const item = monthsMap.get(key);
          item.sales = Number((item.sales + (order.total || 0)).toFixed(2));
          item.profit = Number((item.sales * 0.38).toFixed(2));
          item.orders += 1;
        }
      });

      return Array.from(monthsMap.values());
    }
  }, [filteredOrders, activeDateBounds, dateRange]);

  // Product Performance (Best-Selling and Low-Performing Products)
  const { bestSellers, lowPerformers, allProductStats } = useMemo(() => {
    const statsMap = new Map();

    const catalogList =
      catalogProducts && catalogProducts.length > 0
        ? catalogProducts
        : FALLBACK_CATALOG_PRODUCTS;

    catalogList.forEach((p) => {
      statsMap.set(String(p._id || p.name), {
        id: p._id,
        name: p.name,
        sku: p.sku || "LX-CAT",
        price: p.price || 0,
        image: p.images?.[0]?.url || p.image || "",
        stock: p.stock ?? 15,
        category: p.category?.name || "Luxury Apparel",
        unitsSold: 0,
        revenue: 0,
        ordersCount: 0
      });
    });

    filteredOrders.forEach((order) => {
      if (order.status === "cancelled") return;
      (order.items || []).forEach((item) => {
        let entry = null;
        if (item.productId && statsMap.has(String(item.productId))) {
          entry = statsMap.get(String(item.productId));
        } else {
          for (const [_, val] of statsMap.entries()) {
            if (val.name.toLowerCase() === (item.name || "").toLowerCase()) {
              entry = val;
              break;
            }
          }
        }

        if (!entry) {
          entry = {
            id: item.productId || `item_${item.name}`,
            name: item.name || "Luxury Item",
            sku: item.sku || "LX-CAT",
            price: item.price || 0,
            image: item.image || "",
            stock: 12,
            category: "Catalog",
            unitsSold: 0,
            revenue: 0,
            ordersCount: 0
          };
          statsMap.set(entry.id, entry);
        }

        const qty = item.quantity || 1;
        entry.unitsSold += qty;
        entry.revenue += (item.price || 0) * qty;
        entry.ordersCount += 1;
      });
    });

    const allList = Array.from(statsMap.values());
    const best = allList
      .filter((p) => p.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

    const low = allList
      .filter((p) => p.unitsSold <= 1)
      .sort((a, b) => b.stock - a.stock);

    return { bestSellers: best, lowPerformers: low, allProductStats: allList };
  }, [filteredOrders, catalogProducts]);

  // Inventory distribution stats
  const inventoryHealth = useMemo(() => {
    const list =
      catalogProducts && catalogProducts.length > 0
        ? catalogProducts
        : FALLBACK_CATALOG_PRODUCTS;
    const outOfStock = list.filter((p) => Number(p.stock) === 0).length;
    const lowStockCount = list.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
    const healthyCount = list.filter((p) => Number(p.stock) > 10).length;
    const total = list.length;

    return {
      total,
      outOfStock,
      lowStockCount,
      healthyCount,
      outOfStockPct: total > 0 ? (outOfStock / total) * 100 : 0,
      lowStockPct: total > 0 ? (lowStockCount / total) * 100 : 0,
      healthyPct: total > 0 ? (healthyCount / total) * 100 : 0
    };
  }, [catalogProducts]);

  // Date range label for display and reports
  const activeRangeLabel = useMemo(() => {
    if (dateRange === "today") return "Today";
    if (dateRange === "7D") return "Last 7 Days";
    if (dateRange === "30D") return "Last 30 Days";
    if (dateRange === "month") return "This Month";
    if (dateRange === "90D") return "Last 90 Days";
    if (dateRange === "all") return "All Time";
    if (dateRange === "custom") {
      const s = appliedCustomStart || "Start";
      const e = appliedCustomEnd || "Present";
      return `${s} to ${e}`;
    }
    return "Selected Range";
  }, [dateRange, appliedCustomStart, appliedCustomEnd]);

  // ── CSV Export Functionality ────────────────────────────────────────────────
  const exportCSV = (filename, rows) => {
    const processCell = (cell) => {
      if (cell === null || cell === undefined) return '""';
      const stringVal = String(cell).replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const csvContent = "\uFEFF" + rows.map((row) => row.map(processCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSummaryCSV = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const rows = [
      ["Luxeva E-Commerce Operations Summary Report", "", ""],
      ["Generated At", new Date().toLocaleString(), ""],
      ["Period Filter", activeRangeLabel, ""],
      ["----------------------------------------", "--------------------", "--------------------"],
      ["Metric", "Value", "Notes / Analysis"],
      ["Total Net Revenue", `INR ${metrics.revenue.toLocaleString()}`, "Fulfilled and active checkouts"],
      ["Estimated Gross Profit (38%)", `INR ${metrics.estimatedProfit.toLocaleString()}`, "Estimated gross margin benchmark"],
      ["Total Orders Placed", metrics.orders, "All orders within selected filter"],
      ["Delivered Orders", metrics.deliveredOrders, "Successfully delivered"],
      ["Active Orders In-Transit", metrics.activeOrders, "Placed, packed, shipped, out for delivery"],
      ["Cancelled Orders", metrics.cancelledOrders, "Cancelled before or during fulfillment"],
      ["Cancellation Rate", `${metrics.cancellationRate.toFixed(1)}%`, metrics.cancellationRate > 15 ? "High Risk" : "Healthy"],
      ["Lost Gross Revenue", `INR ${metrics.lostRevenue.toLocaleString()}`, "Lost sales from cancelled orders"],
      ["Average Order Value (AOV)", `INR ${metrics.averageOrderValue.toLocaleString()}`, "Revenue per valid order"],
      ["----------------------------------------", "--------------------", "--------------------"],
      ["Milestone Stage", "Orders Count", "Distribution Status"],
      ["Placed", metrics.statusBreakdown?.placed || 0, "Awaiting packing"],
      ["Packed", metrics.statusBreakdown?.packed || 0, "Ready for dispatch"],
      ["Shipped", metrics.statusBreakdown?.shipped || 0, "In transit with logistics"],
      ["Out for Delivery", metrics.statusBreakdown?.out_for_delivery || 0, "With delivery agent"],
      ["Delivered", metrics.statusBreakdown?.delivered || 0, "Fulfilled successfully"],
      ["Cancelled", metrics.statusBreakdown?.cancelled || 0, "Cancelled"]
    ];

    exportCSV(`luxeva-operations-summary-${dateStamp}.csv`, rows);
    toast.success("Operations summary CSV downloaded!");
    setExportOpen(false);
  };

  const handleExportProductPerformanceCSV = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const headers = [
      "Product Name",
      "SKU",
      "Price (INR)",
      "Units Sold",
      "Revenue Generated (INR)",
      "Current Stock",
      "Inventory Alert",
      "Performance Category"
    ];

    const rows = [
      ["Luxeva Catalog & Product Performance Report", "", "", "", "", "", "", ""],
      ["Period Filter", activeRangeLabel, "", "", "", "", "", ""],
      headers,
      ...allProductStats.map((p) => [
        p.name,
        p.sku || "N/A",
        p.price,
        p.unitsSold,
        p.revenue,
        p.stock,
        p.stock === 0 ? "Out of Stock" : p.stock <= 10 ? "Low Stock Alert" : "Adequate",
        p.unitsSold >= 3 ? "Best Seller" : p.unitsSold > 0 ? "Active Moving" : p.stock > 10 ? "Stagnant / Low Velocity" : "Low Demand"
      ])
    ];

    exportCSV(`luxeva-product-performance-${dateStamp}.csv`, rows);
    toast.success("Product performance CSV downloaded!");
    setExportOpen(false);
  };

  const handleExportOrdersLogCSV = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const headers = [
      "Order Number",
      "Date Placed",
      "Customer Name",
      "Customer Email",
      "Fulfillment Status",
      "Items Count",
      "Items Breakdown",
      "Total Amount (INR)",
      "City",
      "State",
      "Logistics Carrier",
      "Tracking Number"
    ];

    const ordersToLog = filteredOrders.length > 0 ? filteredOrders : allOrders;
    const rows = [
      ["Luxeva Orders Audit Log", "", "", "", "", "", "", "", "", "", "", ""],
      ["Filter Range", activeRangeLabel, "", "", "", "", "", "", "", "", "", ""],
      headers,
      ...ordersToLog.map((o) => [
        o.orderNumber || o._id,
        o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
        o.customer?.name || "Guest Customer",
        o.customer?.email || "",
        o.status || "placed",
        (o.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
        (o.items || []).map((i) => `${i.name} (x${i.quantity || 1})`).join("; "),
        o.total || 0,
        o.shipping?.address?.city || o.shippingAddress?.city || "N/A",
        o.shipping?.address?.state || o.shippingAddress?.state || "N/A",
        o.shipping?.carrier || "N/A",
        o.shipping?.trackingNumber || "N/A"
      ])
    ];

    exportCSV(`luxeva-orders-log-${dateStamp}.csv`, rows);
    toast.success("Orders log CSV downloaded!");
    setExportOpen(false);
  };

  // ── PDF Export Functionality ────────────────────────────────────────────────
  const handleExportSummaryPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const dateStamp = new Date().toISOString().split("T")[0];

    // Luxury Header Banner
    doc.setFillColor(21, 21, 21);
    doc.rect(0, 0, 595, 75, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("LUXEVA COMMERCE PLATFORM", 40, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("EXECUTIVE OPERATIONS & REVENUE REPORT", 40, 54);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period Filter: ${activeRangeLabel}`, 40, 95);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 380, 95);

    // Section 1: Financial & Fulfillment Summary Table
    autoTable(doc, {
      startY: 110,
      head: [["Performance Metric", "Value", "Operational Analysis"]],
      body: [
        ["Total Net Revenue", `INR ${metrics.revenue.toLocaleString()}`, "Fulfilled and active checkouts"],
        ["Estimated Gross Profit (38%)", `INR ${metrics.estimatedProfit.toLocaleString()}`, "Estimated gross margin benchmark"],
        ["Total Orders Placed", `${metrics.orders} orders`, "Orders recorded within date window"],
        ["Delivered Orders", `${metrics.deliveredOrders} orders`, "Successfully fulfilled"],
        ["Active Orders In-Transit", `${metrics.activeOrders} orders`, "Placed, packed, shipped, out for delivery"],
        ["Cancelled Orders", `${metrics.cancelledOrders} orders`, "Order cancellations"],
        ["Cancellation Rate", `${metrics.cancellationRate.toFixed(1)}%`, metrics.cancellationRate > 15 ? "High Risk Attention" : "Healthy Performance"],
        ["Lost Gross Revenue", `INR ${metrics.lostRevenue.toLocaleString()}`, "Unrealized gross revenue from cancellations"],
        ["Average Order Value (AOV)", `INR ${metrics.averageOrderValue.toLocaleString()}`, "Revenue per valid order checkout"]
      ],
      theme: "striped",
      headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 }
    });

    const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 320;

    // Section 2: Fulfillment Pipeline Stage Distribution
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(21, 21, 21);
    doc.text("Fulfillment Pipeline Stage Breakdown", 40, nextY);

    autoTable(doc, {
      startY: nextY + 10,
      head: [["Milestone Stage", "Orders Count", "Distribution (%)", "Operational Status"]],
      body: [
        ["Placed", `${metrics.statusBreakdown?.placed || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.placed || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "Awaiting warehouse fulfillment"],
        ["Packed", `${metrics.statusBreakdown?.packed || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.packed || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "Packed in eco-friendly packaging"],
        ["Shipped", `${metrics.statusBreakdown?.shipped || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.shipped || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "In transit with logistics courier"],
        ["Out for Delivery", `${metrics.statusBreakdown?.out_for_delivery || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.out_for_delivery || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "With local delivery partner"],
        ["Delivered", `${metrics.statusBreakdown?.delivered || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.delivered || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "Successfully received by customer"],
        ["Cancelled", `${metrics.statusBreakdown?.cancelled || 0}`, `${metrics.orders ? (((metrics.statusBreakdown?.cancelled || 0) / metrics.orders) * 100).toFixed(1) : 0}%`, "Terminated before delivery"]
      ],
      theme: "striped",
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 }
    });

    const nextY2 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 520;

    // Section 3: Inventory Health Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(21, 21, 21);
    doc.text("Warehouse Inventory Stock Health", 40, nextY2);

    autoTable(doc, {
      startY: nextY2 + 10,
      head: [["Stock Status Category", "Products Count", "Catalog Share", "Action Required"]],
      body: [
        ["Critical: Out of Stock (0 units)", `${inventoryHealth.outOfStock}`, `${inventoryHealth.outOfStockPct.toFixed(1)}%`, "Urgent restock needed"],
        ["Warning: Low Stock (1-10 units)", `${inventoryHealth.lowStockCount}`, `${inventoryHealth.lowStockPct.toFixed(1)}%`, "Replenishment recommended"],
        ["Adequate: Healthy Stock (>10 units)", `${inventoryHealth.healthyCount}`, `${inventoryHealth.healthyPct.toFixed(1)}%`, "Inventory levels optimal"],
        ["Total Active Products in Catalog", `${inventoryHealth.total}`, "100%", "Monitored across categories"]
      ],
      theme: "striped",
      headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 }
    });

    // Multi-page footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Luxeva Confidential • Operations Telemetry • Page ${i} of ${pageCount}`,
        40,
        doc.internal.pageSize.height - 20
      );
    }

    doc.save(`luxeva-operations-summary-${dateStamp}.pdf`);
    toast.success("Operations summary PDF downloaded!");
    setExportOpen(false);
  };

  const handleExportProductPerformancePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const dateStamp = new Date().toISOString().split("T")[0];

    doc.setFillColor(21, 21, 21);
    doc.rect(0, 0, 595, 75, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("LUXEVA COMMERCE PLATFORM", 40, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("PRODUCT PERFORMANCE & CATALOG VELOCITY REPORT", 40, 54);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period Filter: ${activeRangeLabel}`, 40, 95);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 380, 95);

    const tableBody = allProductStats.map((p, idx) => [
      idx + 1,
      p.name,
      p.sku || "N/A",
      `INR ${p.price.toLocaleString()}`,
      `${p.unitsSold} units`,
      `INR ${p.revenue.toLocaleString()}`,
      p.stock === 0 ? "0 (Out)" : `${p.stock}`,
      p.unitsSold >= 3 ? "Top Seller" : p.unitsSold > 0 ? "Active Moving" : p.stock > 10 ? "Stagnant Stock" : "Low Demand"
    ]);

    autoTable(doc, {
      startY: 110,
      head: [["#", "Product Name", "SKU", "Price", "Sold", "Revenue", "Stock", "Status"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Luxeva Confidential • Product Analytics • Page ${i} of ${pageCount}`,
        40,
        doc.internal.pageSize.height - 20
      );
    }

    doc.save(`luxeva-product-performance-${dateStamp}.pdf`);
    toast.success("Product performance PDF downloaded!");
    setExportOpen(false);
  };

  const handleExportOrdersLogPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const dateStamp = new Date().toISOString().split("T")[0];

    // Landscape width: 842 pt
    doc.setFillColor(21, 21, 21);
    doc.rect(0, 0, 842, 65, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("LUXEVA COMMERCE PLATFORM", 40, 32);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("ORDERS AUDIT & FULFILLMENT LOG", 40, 48);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period Filter: ${activeRangeLabel}`, 40, 82);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 620, 82);

    const ordersToLog = filteredOrders.length > 0 ? filteredOrders : allOrders;
    const tableBody = ordersToLog.map((o) => [
      o.orderNumber || o._id,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A",
      o.customer?.name || "Customer",
      o.customer?.email || "",
      (o.status || "placed").toUpperCase(),
      (o.items || []).map((i) => `${i.name} (x${i.quantity || 1})`).join(", "),
      `INR ${(o.total || 0).toLocaleString()}`,
      o.shipping?.address?.city || o.shippingAddress?.city || "N/A",
      o.shipping?.carrier || "N/A",
      o.shipping?.trackingNumber || "N/A"
    ]);

    autoTable(doc, {
      startY: 95,
      head: [["Order #", "Date", "Customer", "Email", "Status", "Items", "Total", "Destination", "Carrier", "Tracking #"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Luxeva Confidential • Orders Audit Log • Page ${i} of ${pageCount}`,
        40,
        doc.internal.pageSize.height - 20
      );
    }

    doc.save(`luxeva-orders-log-${dateStamp}.pdf`);
    toast.success("Orders log PDF downloaded!");
    setExportOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      toast.error("Start date must be before end date");
      return;
    }
    setAppliedCustomStart(customStart);
    setAppliedCustomEnd(customEnd);
    toast.success(`Filter applied: ${customStart} to ${customEnd}`);
  };

  // Top 4 operational KPI Cards
  const kpiCards = [
    {
      label: "Total Net Revenue",
      value: currency(metrics.revenue || 0),
      subtext: `Gross sales in ${activeRangeLabel.toLowerCase()}`,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bgIcon: "bg-emerald-500/10 dark:bg-emerald-500/20"
    },
    {
      label: "Total Orders",
      value: metrics.orders || 0,
      subtext: `${metrics.deliveredOrders || 0} delivered • ${metrics.cancelledOrders || 0} cancelled`,
      icon: ShoppingBag,
      color: "text-blue-600 dark:text-blue-400",
      bgIcon: "bg-blue-500/10 dark:bg-blue-500/20"
    },
    {
      label: "Average Order Value",
      value: currency(metrics.averageOrderValue || 0),
      subtext: "Per successful checkout",
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bgIcon: "bg-amber-500/10 dark:bg-amber-500/20"
    },
    {
      label: "Active Transit Pipeline",
      value: metrics.activeOrders || 0,
      subtext: "Orders awaiting or in transit",
      icon: Truck,
      color: "text-purple-600 dark:text-purple-400",
      bgIcon: "bg-purple-500/10 dark:bg-purple-500/20"
    }
  ];

  // Filtered displayed products in table
  const displayedProducts = useMemo(() => {
    const list = productTab === "best" ? bestSellers : lowPerformers;
    if (!productSearch.trim()) return list;
    const q = productSearch.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [productTab, bestSellers, lowPerformers, productSearch]);

  return (
    <div className="space-y-8">
      {/* ── Header with Title, Telemetry, and Primary Controls ────────────── */}
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

        <div className="flex flex-wrap items-center gap-3">
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

          {/* Downloadable PDF & CSV Reports Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-sand/60 px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-sand dark:border-white/12 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Download size={14} />
              <span>Export Reports</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${exportOpen ? "rotate-180" : ""}`} />
            </button>

            {exportOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-2xl border border-ink/10 bg-white p-3 shadow-xl backdrop-blur-lg dark:border-white/12 dark:bg-[#1f1f1f] dark:shadow-black/70 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 pb-2.5 border-b border-ink/5 dark:border-white/5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-clay dark:text-white/50">
                      Export Operations Data
                    </p>
                    <p className="text-[11px] text-clay/80 dark:text-white/40">{activeRangeLabel}</p>
                  </div>

                  {/* Format Selector Pills (PDF / CSV) */}
                  <div className="flex items-center rounded-full bg-sand/80 p-0.5 dark:bg-white/10">
                    <button
                      type="button"
                      onClick={() => setExportFormatTab("pdf")}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        exportFormatTab === "pdf"
                          ? "bg-ink text-white shadow-xs dark:bg-white dark:text-ink"
                          : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      <FileText size={11} />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormatTab("csv")}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        exportFormatTab === "csv"
                          ? "bg-ink text-white shadow-xs dark:bg-white dark:text-ink"
                          : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      <FileSpreadsheet size={11} />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Report Options List */}
                <div className="mt-2 space-y-1">
                  {/* Report 1: Operations Summary */}
                  <div className="flex items-center justify-between rounded-xl p-2 transition hover:bg-ink/5 dark:hover:bg-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        {exportFormatTab === "pdf" ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-ink dark:text-white">Operations Summary</p>
                        <p className="text-[10px] text-clay dark:text-white/50 truncate">Revenue, profit, KPIs & stages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        type="button"
                        onClick={handleExportSummaryPDF}
                        title="Download Summary as PDF"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleExportSummaryCSV}
                        title="Download Summary as CSV"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* Report 2: Product Performance */}
                  <div className="flex items-center justify-between rounded-xl p-2 transition hover:bg-ink/5 dark:hover:bg-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                        {exportFormatTab === "pdf" ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-ink dark:text-white">Product Performance</p>
                        <p className="text-[10px] text-clay dark:text-white/50 truncate">Best sellers & slow stock</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        type="button"
                        onClick={handleExportProductPerformancePDF}
                        title="Download Product Performance as PDF"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleExportProductPerformanceCSV}
                        title="Download Product Performance as CSV"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* Report 3: Filtered Orders Log */}
                  <div className="flex items-center justify-between rounded-xl p-2 transition hover:bg-ink/5 dark:hover:bg-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        {exportFormatTab === "pdf" ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-ink dark:text-white">Orders Audit Log</p>
                        <p className="text-[10px] text-clay dark:text-white/50 truncate">Full customer & dispatch ledger</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        type="button"
                        onClick={handleExportOrdersLogPDF}
                        title="Download Orders Log as PDF"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleExportOrdersLogCSV}
                        title="Download Orders Log as CSV"
                        className="rounded-lg border border-ink/10 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition dark:border-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/portal/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-ink/80 dark:bg-white dark:text-ink dark:hover:bg-white/90"
          >
            <span>Manage Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Date-Range Filter Bar ─────────────────────────────────────────── */}
      <div className="rounded-[1.8rem] border border-ink/10 bg-white p-4 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-clay dark:text-white/50 pr-2">
              <Calendar size={14} />
              <span>Range:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {DATE_PRESETS.map((preset) => {
                const isActive = dateRange === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      setDateRange(preset.key);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                        : "bg-ink/5 text-ink hover:bg-ink/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-clay dark:text-white/50">
            <span className="font-medium text-ink dark:text-white">{metrics.orders}</span> {metrics.orders === 1 ? "order" : "orders"} in{" "}
            <span className="font-semibold text-ink dark:text-white">{activeRangeLabel}</span>
          </div>
        </div>

        {/* Custom Range Expandable Sub-bar */}
        {dateRange === "custom" && (
          <div className="mt-3.5 pt-3.5 border-t border-ink/5 dark:border-white/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-clay dark:text-white/60">From:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-ink/10 bg-sand/30 px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-clay dark:text-white/60">To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-ink/10 bg-sand/30 px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustomRange}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/80 dark:bg-white dark:text-ink dark:hover:bg-white/90"
            >
              <Check size={13} />
              <span>Apply Range</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Top 4 Operational KPI Cards ───────────────────────────────────── */}
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

      {/* ── Inventory Alerts and Cancellation Rates Section ───────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cancellation Rate & Health Alert Card */}
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Percent size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink dark:text-white">Cancellation Rate & Health</h2>
                <p className="text-xs text-clay dark:text-white/50">Cancelled checkouts & lost sales in period</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                metrics.cancellationRate <= 5
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : metrics.cancellationRate <= 15
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              }`}
            >
              {metrics.cancellationRate <= 5 ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>Healthy Risk</span>
                </>
              ) : metrics.cancellationRate <= 15 ? (
                <>
                  <AlertTriangle size={12} />
                  <span>Moderate</span>
                </>
              ) : (
                <>
                  <AlertOctagon size={12} />
                  <span>High Attention</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-ink/5 bg-sand/40 p-4 dark:border-white/5 dark:bg-white/5">
              <p className="text-xs font-medium text-clay dark:text-white/50">Cancellation Rate</p>
              <p className="mt-1 text-2xl font-bold text-ink dark:text-white">
                {metrics.cancellationRate.toFixed(1)}%
              </p>
              <p className="mt-0.5 text-[11px] text-clay dark:text-white/40">
                {metrics.cancelledOrders} of {metrics.orders} orders cancelled
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
              <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Lost Gross Revenue</p>
              <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400">
                {currency(metrics.lostRevenue)}
              </p>
              <p className="mt-0.5 text-[11px] text-rose-600/80 dark:text-rose-300/70">From customer cancellations</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-clay dark:text-white/50">
            {metrics.cancellationRate > 10
              ? "Tip: Monitor products frequently cancelled to identify size mismatches, delivery delays, or payment issues."
              : "Fulfillment consistency is strong. Order completion rate remains above standard industry thresholds."}
          </p>
        </div>

        {/* Inventory Stock Health & Critical Alerts Card */}
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink dark:text-white">Inventory Alerts & Health</h2>
                <p className="text-xs text-clay dark:text-white/50">Stock distribution across active catalog</p>
              </div>
            </div>

            <Link
              to="/portal/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline dark:text-white/80"
            >
              <span>Restock</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* 3 Metric Pills */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center dark:border-rose-500/30 dark:bg-rose-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Out of Stock
              </p>
              <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                {inventoryHealth.outOfStock}
              </p>
              <p className="text-[10px] text-rose-600/70 dark:text-rose-300/60">0 units left</p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Low Stock
              </p>
              <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                {inventoryHealth.lowStockCount}
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-300/60">&lt; 10 units</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Healthy Stock
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {inventoryHealth.healthyCount}
              </p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-300/60">&gt; 10 units</p>
            </div>
          </div>

          {/* Visual Stock Level Progress Bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/5 dark:bg-white/10 flex">
              <div
                style={{ width: `${inventoryHealth.outOfStockPct}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`${inventoryHealth.outOfStock} out of stock`}
              />
              <div
                style={{ width: `${inventoryHealth.lowStockPct}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`${inventoryHealth.lowStockCount} low stock`}
              />
              <div
                style={{ width: `${inventoryHealth.healthyPct}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`${inventoryHealth.healthyCount} healthy stock`}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-clay dark:text-white/50">
              <span>{inventoryHealth.total} active catalog items</span>
              <span>Threshold: 10 units</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Multi-Metric Trends Visualization (Revenue, Profit, and Orders) ── */}
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-ink dark:text-white">Revenue, Profit & Order Trends</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                38% Margin
              </span>
            </div>
            <p className="text-xs text-clay dark:text-white/50">
              Tracking net sales, estimated retail gross profit, and checkout volume in {activeRangeLabel.toLowerCase()}
            </p>
          </div>

          {/* Metric Switcher Pills */}
          <div className="flex items-center gap-1.5 rounded-full bg-sand/60 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setChartMetric("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                chartMetric === "all"
                  ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              All Trends
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("revenue")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                chartMetric === "revenue"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("profit")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                chartMetric === "profit"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Profit (₹)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("orders")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                chartMetric === "orders"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Orders (#)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          {(chartMetric === "all" || chartMetric === "revenue") && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-clay dark:text-white/60">Net Revenue:</span>
              <span className="font-bold text-ink dark:text-white">{currency(metrics.revenue)}</span>
            </div>
          )}
          {(chartMetric === "all" || chartMetric === "profit") && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="text-clay dark:text-white/60">Estimated Profit:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currency(metrics.estimatedProfit)}</span>
            </div>
          )}
          {(chartMetric === "all" || chartMetric === "orders") && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-clay dark:text-white/60">Order Volume:</span>
              <span className="font-bold text-ink dark:text-white">{metrics.orders} orders</span>
            </div>
          )}
        </div>

        {/* The Area Chart */}
        <div className="mt-6 h-72 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-clay">Loading chart data...</div>
          ) : trendData && trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.revenueFill} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColors.revenueFill} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.profitFill} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColors.profitFill} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.ordersFill} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColors.ordersFill} stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.gridStroke }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (chartMetric === "orders") return val;
                    return val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`;
                  }}
                />
                <Tooltip content={<CustomChartTooltip theme={theme} metricMode={chartMetric} />} />

                {/* Revenue Curve */}
                {(chartMetric === "all" || chartMetric === "revenue") && (
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Revenue"
                    stroke={chartColors.revenueStroke}
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={{ r: 3, fill: chartColors.revenueStroke, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: chartColors.revenueStroke, stroke: theme === "dark" ? "#222" : "#fff", strokeWidth: 2 }}
                  />
                )}

                {/* Profit Curve */}
                {(chartMetric === "all" || chartMetric === "profit") && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke={chartColors.profitStroke}
                    strokeWidth={2.5}
                    fill="url(#profitGrad)"
                    dot={{ r: 3, fill: chartColors.profitStroke, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: chartColors.profitStroke, stroke: theme === "dark" ? "#222" : "#fff", strokeWidth: 2 }}
                  />
                )}

                {/* Orders Volume Curve */}
                {chartMetric === "orders" && (
                  <Area
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={chartColors.ordersStroke}
                    strokeWidth={2.5}
                    fill="url(#ordersGrad)"
                    dot={{ r: 3, fill: chartColors.ordersStroke, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: chartColors.ordersStroke, stroke: theme === "dark" ? "#222" : "#fff", strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-ink/10 dark:border-white/10">
              <TrendingUp size={28} className="text-clay/40" />
              <p className="mt-2 text-xs font-semibold text-clay dark:text-white/60">No sales records in this date range</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Fulfillment Distribution Pipeline ──────────────────────── */}
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
            const count = metrics.statusBreakdown?.[status.key] || 0;
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

      {/* ── Best-Selling and Low-Performing Products ─────────────────────── */}
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink dark:text-white">Product Performance Insights</h2>
            <p className="text-xs text-clay dark:text-white/50">
              Identify top revenue drivers alongside slow-moving or overstocked catalog items
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center rounded-full bg-sand/60 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setProductTab("best")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  productTab === "best"
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                <Award size={14} />
                <span>Best-Selling ({bestSellers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setProductTab("low")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  productTab === "low"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                <TrendingDown size={14} />
                <span>Low-Performing ({lowPerformers.length})</span>
              </button>
            </div>

            <Link
              to="/portal/admin/products"
              className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <span>Manage Catalog</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Product Table / Cards */}
        <div className="mt-5 overflow-x-auto">
          {displayedProducts.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink/5 text-clay dark:border-white/5 dark:text-white/50">
                  <th className="pb-3 font-semibold uppercase tracking-wider">Rank & Product</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-right">Price</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">Units Sold</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-right">Revenue</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">Warehouse Stock</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-white/5">
                {displayedProducts.slice(0, 8).map((product, idx) => {
                  const isBest = productTab === "best";
                  return (
                    <tr
                      key={product.id || product.name}
                      className="group transition hover:bg-sand/30 dark:hover:bg-white/5"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              isBest
                                ? idx === 0
                                  ? "bg-amber-500 text-white"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-800"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-ink/5 text-clay dark:bg-white/10 dark:text-white/60"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink dark:text-white truncate max-w-[200px] sm:max-w-xs">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-clay dark:text-white/40">SKU: {product.sku || "N/A"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4 text-clay dark:text-white/60">
                        {product.category || "Luxury Apparel"}
                      </td>

                      <td className="py-3.5 pr-4 text-right font-medium text-ink dark:text-white">
                        {currency(product.price)}
                      </td>

                      <td className="py-3.5 pr-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 font-bold ${
                            product.unitsSold > 0
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-ink/5 text-clay dark:bg-white/5 dark:text-white/50"
                          }`}
                        >
                          {product.unitsSold} {product.unitsSold === 1 ? "unit" : "units"}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 text-right font-bold text-ink dark:text-white">
                        {currency(product.revenue)}
                      </td>

                      <td className="py-3.5 pr-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            product.stock === 0
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : product.stock <= 10
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-ink/5 text-ink dark:bg-white/10 dark:text-white"
                          }`}
                        >
                          {product.stock === 0 ? "0 (Out of stock)" : `${product.stock} in stock`}
                        </span>
                      </td>

                      <td className="py-3.5 text-right">
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <Sparkles size={11} />
                            <span>Top Seller</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            <AlertTriangle size={11} />
                            <span>{product.stock > 10 ? "Stagnant Stock" : "Low Sales"}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-clay dark:text-white/50">
              No products found in this classification.
            </div>
          )}
        </div>
      </div>

      {/* ── Main Grid: Detailed Low-Stock Alerts & Notification Feed ─────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Low-Stock & Inventory Alerts */}
        <div className="flex flex-col justify-between rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink dark:text-white">Critical Stock Level Alerts</h2>
                <p className="text-xs text-clay dark:text-white/50">Items below replenishment safety threshold (10 units)</p>
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
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        Number(product.stock) === 0
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {Number(product.stock) === 0 ? "Out of stock" : `${product.stock} left`}
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
              notifications.slice(0, 5).map((notification) => (
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
      </div>

      {/* ── Newsletter Audience & Broadcast Campaigns Section ── */}
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white dark:bg-white dark:text-ink">
                <Mail size={14} />
              </span>
              <h2 className="text-base font-semibold text-ink dark:text-white">
                Newsletter Audience & Broadcast Campaigns
              </h2>
            </div>
            <p className="mt-1 text-xs text-clay dark:text-white/50">
              Manage storefront newsletter signups and broadcast curated Luxeva updates, private drops, and announcements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeSubscribersCount} Active Subscribers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-clay dark:bg-white/8 dark:text-white/60">
              <Megaphone size={12} />
              {campaigns.length} Broadcasts Sent
            </span>
            <button
              type="button"
              onClick={() => setBroadcastModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ink/80 active:scale-95 dark:bg-white dark:text-ink dark:hover:bg-white/90"
            >
              <Send size={13} />
              Compose Broadcast
            </button>
          </div>
        </div>

        {/* Audience & Broadcast Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left Column: Subscribers Roster (7 cols) */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-ink/8 bg-sand/30 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-clay dark:text-white/50" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-white">
                  Subscriber List ({filteredSubscribers.length})
                </h3>
              </div>
              <div className="relative w-48 sm:w-56">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search subscriber email..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  className="w-full rounded-full border border-ink/10 bg-white py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-clay outline-none transition focus:border-ink/30 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
              {filteredSubscribers.length === 0 ? (
                <div className="py-12 text-center text-xs text-clay dark:text-white/40">
                  {subscriberSearch
                    ? "No subscribers match your search."
                    : "No newsletter subscribers yet. Subscriptions made on the storefront will appear here."}
                </div>
              ) : (
                <div className="divide-y divide-ink/5 dark:divide-white/5">
                  {filteredSubscribers.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between py-2.5 px-1 text-xs transition hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 font-semibold text-[11px] text-ink dark:bg-white/10 dark:text-white">
                          {sub.email?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink dark:text-white truncate">{sub.email}</p>
                          <p className="text-[10px] text-clay dark:text-white/45">
                            Subscribed {sub.subscribedAt ? shortDate(sub.subscribedAt) : "Recently"} ·{" "}
                            {sub.source || "storefront"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            sub.status === "subscribed"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-ink/5 text-clay dark:bg-white/10 dark:text-white/50"
                          }`}
                        >
                          {sub.status || "active"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubscriber(sub._id, sub.email)}
                          title="Remove subscriber"
                          className="rounded-lg p-1 text-clay hover:bg-rose-500/10 hover:text-rose-600 transition dark:text-white/40 dark:hover:text-rose-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Campaign Broadcasts History (5 cols) */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-ink/8 bg-sand/30 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Megaphone size={15} className="text-clay dark:text-white/50" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-white">
                  Broadcast History ({campaigns.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <div className="py-12 text-center text-xs text-clay dark:text-white/40">
                  No campaigns broadcasted yet. Click "Compose Broadcast" to send a drop announcement or
                  newsletter to your subscribers.
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div
                    key={camp._id}
                    className="rounded-xl border border-ink/5 bg-white p-3.5 shadow-sm transition hover:border-ink/15 dark:border-white/5 dark:bg-[#1f1f1f] dark:hover:border-white/15"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-clay dark:bg-white/8 dark:text-white/60">
                        {camp.category?.replace("_", " ") || "announcement"}
                      </span>
                      <span className="text-[10px] text-clay dark:text-white/45">
                        {camp.sentAt ? shortDate(camp.sentAt) : "Just now"}
                      </span>
                    </div>
                    <h4 className="mt-1.5 font-semibold text-xs text-ink dark:text-white line-clamp-1">
                      {camp.subject}
                    </h4>
                    <p className="mt-1 text-[11px] text-clay dark:text-white/65 line-clamp-2 leading-relaxed">
                      {camp.message}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-ink/5 dark:border-white/5 text-[10px] text-clay dark:text-white/50">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check size={11} /> Sent to {camp.recipientCount || subscribers.length} subscribers
                      </span>
                      {camp.actionUrl && (
                        <span className="font-mono text-clay/80 dark:text-white/40">
                          {camp.actionUrl}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast Composer Modal ── */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1c1c1c] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ink/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink dark:text-white">Broadcast to Subscribers</h3>
                  <p className="text-xs text-clay dark:text-white/50">
                    Dispatch an editorial update, private drop, or announcement to {activeSubscribersCount} active subscribers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="rounded-full p-1.5 text-clay hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Campaign Category
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { key: "private_drop", label: "Private Drop" },
                    { key: "weekly_edit", label: "Weekly Edit" },
                    { key: "flash_sale", label: "Flash Sale" },
                    { key: "announcement", label: "Announcement" }
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setBroadcastForm((f) => ({ ...f, category: cat.key }))}
                      className={`rounded-xl py-2 px-2.5 text-xs font-medium text-center transition border ${
                        broadcastForm.category === cat.key
                          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                          : "border-ink/10 bg-sand/30 text-clay hover:border-ink/30 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Private Access: Autumn Silk Collection is Live"
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Header / Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Handcrafted Autumn Edit"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Campaign Content / Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the newsletter message, launch details, promo highlights..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))}
                  className="input rounded-2xl resize-none py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Now"
                    value={broadcastForm.actionText}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, actionText: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                    Target Destination URL
                  </label>
                  <input
                    type="text"
                    placeholder="/shop"
                    value={broadcastForm.actionUrl}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, actionUrl: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Preview card */}
              <div className="rounded-2xl border border-dashed border-ink/15 bg-sand/30 p-3.5 dark:border-white/15 dark:bg-white/[0.02]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-clay dark:text-white/40 mb-1.5">
                  Subscriber Broadcast Preview
                </p>
                <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#222222]">
                  <p className="text-xs font-bold text-ink dark:text-white">
                    {broadcastForm.subject || "Subject line preview..."}
                  </p>
                  <p className="mt-1 text-xs text-clay dark:text-white/60 whitespace-pre-wrap">
                    {broadcastForm.message || "Your campaign message content will display here to subscribers."}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-ink/5 flex justify-end dark:border-white/5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white dark:bg-white dark:text-ink">
                      {broadcastForm.actionText || "Explore"}
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="btn-ghost py-2.5 px-5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="btn-primary py-2.5 px-6 text-xs"
                >
                  {sendingBroadcast ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Dispatching to {activeSubscribersCount} Subscribers...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Send Broadcast ({activeSubscribersCount} recipients)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Navigation Shortcuts ────────────────────────────────────── */}
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
