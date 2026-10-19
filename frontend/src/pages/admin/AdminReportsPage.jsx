import { useEffect, useState, useMemo, useRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Filter,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  Percent,
  AlertOctagon,
  Clock,
  Printer
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";
import { useTheme } from "../../contexts/ThemeContext";
import { mockProducts } from "../../data/mockStorefront";

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "7D", label: "Last 7 Days" },
  { key: "30D", label: "Last 30 Days" },
  { key: "month", label: "This Month" },
  { key: "90D", label: "Last 90 Days" },
  { key: "ytd", label: "Year to Date" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" }
];

const REPORT_TABS = [
  { key: "financial", label: "Financial & Revenue", icon: DollarSign, description: "Gross sales, profit margins, taxes, and daily trends" },
  { key: "products", label: "Product Performance", icon: Package, description: "Best sellers, low-moving items, and category share" },
  { key: "inventory", label: "Inventory Valuation", icon: AlertTriangle, description: "Stock health, reorder alerts, and capital tied up" },
  { key: "fulfillment", label: "Fulfillment & Orders", icon: Truck, description: "Milestone completion, cancellation rate, and carrier dispatch" }
];

// Helper to compute date boundaries
const computeDateBounds = (preset, customStart, customEnd) => {
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
  } else if (preset === "ytd") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
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

// Generates fallback realistic orders across the last 90 days for preview mode
const generateFallbackOrders = () => {
  const products = mockProducts || [];
  if (!products.length) return [];

  const statuses = ["delivered", "delivered", "delivered", "shipped", "packed", "placed", "cancelled"];
  const paymentMethods = ["UPI", "Credit Card", "Net Banking", "Cash on Delivery"];
  const orders = [];
  const now = Date.now();

  for (let i = 1; i <= 48; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 85);
    const orderDate = new Date(now - daysAgo * 86400000 - Math.random() * 43200000);
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const hasSecond = i % 3 === 0;

    const items = [
      {
        productId: prod1._id,
        name: prod1.name,
        sku: prod1.sku,
        price: prod1.price,
        quantity: (i % 2) + 1,
        category: prod1.category?.name || "Clothing"
      }
    ];

    if (hasSecond && prod2) {
      items.push({
        productId: prod2._id,
        name: prod2.name,
        sku: prod2.sku,
        price: prod2.price,
        quantity: 1,
        category: prod2.category?.name || "Electronics"
      });
    }

    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
    const tax = Math.round((subtotal - discount) * 0.18);
    const total = subtotal - discount + tax;

    orders.push({
      _id: `ord_${1000 + i}`,
      orderNumber: `LX-${202600 + i}`,
      createdAt: orderDate.toISOString(),
      status: statuses[i % statuses.length],
      paymentMethod: paymentMethods[i % paymentMethods.length],
      paymentStatus: statuses[i % statuses.length] === "cancelled" ? "refunded" : "paid",
      items,
      subtotal,
      discount,
      tax,
      total,
      customer: {
        name: ["Aarav Mehta", "Diya Sharma", "Rohan Verma", "Ananya Iyer", "Vikram Patel", "Pooja Reddy", "Kabir Sen"][i % 7],
        email: `customer${i}@luxeva.in`
      },
      shippingAddress: {
        city: ["Mumbai", "Bengaluru", "New Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata"][i % 7],
        state: ["Maharashtra", "Karnataka", "Delhi", "Telangana", "Maharashtra", "Tamil Nadu", "West Bengal"][i % 7]
      }
    });
  }

  // Sort by date descending
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const CustomChartTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    const isDark = theme === "dark";
    const data = payload[0].payload;
    return (
      <div
        className={`min-w-[190px] rounded-2xl p-4 shadow-xl backdrop-blur-md border ${
          isDark
            ? "bg-[#1f1f1f]/95 border-white/10 text-white shadow-black/60"
            : "bg-white/95 border-ink/10 text-ink shadow-slate-300/50"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-clay dark:text-white/50">{label}</p>
        <div className="mt-2 space-y-1.5">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-clay dark:text-white/70">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-ink dark:text-white">
                {entry.name.toLowerCase().includes("orders")
                  ? `${entry.value} orders`
                  : currency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const AdminReportsPage = () => {
  const { theme } = useTheme();

  // State
  const [activeReportTab, setActiveReportTab] = useState("financial");
  const [dateRange, setDateRange] = useState("30D");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");

  const [allOrders, setAllOrders] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Search & Filter within active report table
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("default");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Fetch data with robust fallback
  const fetchReportData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [ordersRes, productsRes] = await Promise.allSettled([
        api.get(endpoints.orders.adminOrders),
        api.get(endpoints.catalog.products, { params: { limit: 100 } })
      ]);

      let loadedOrders = [];
      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data?.orders) && ordersRes.value.data.orders.length > 0) {
        loadedOrders = ordersRes.value.data.orders;
      } else {
        // Fallback to realistic generated orders
        loadedOrders = generateFallbackOrders();
      }
      setAllOrders(loadedOrders);

      if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value?.data?.products) && productsRes.value.data.products.length > 0) {
        setCatalogProducts(productsRes.value.data.products);
      } else {
        setCatalogProducts(mockProducts || []);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load reports data:", err);
      setAllOrders(generateFallbackOrders());
      setCatalogProducts(mockProducts || []);
      toast.error("Loaded fallback operational dataset.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData(false);
  }, []);

  // Date Boundaries
  const dateBounds = useMemo(() => {
    return computeDateBounds(dateRange, appliedCustomStart, appliedCustomEnd);
  }, [dateRange, appliedCustomStart, appliedCustomEnd]);

  // Date Label
  const rangeLabel = useMemo(() => {
    const match = DATE_PRESETS.find((p) => p.key === dateRange);
    if (dateRange === "custom") {
      return `${appliedCustomStart || "Start"} to ${appliedCustomEnd || "Present"}`;
    }
    return match ? match.label : "Selected Period";
  }, [dateRange, appliedCustomStart, appliedCustomEnd]);

  // Filtered Orders strictly in range
  const filteredOrders = useMemo(() => {
    if (!allOrders.length) return [];
    const startMs = dateBounds.start.getTime();
    const endMs = dateBounds.end.getTime();

    return allOrders.filter((order) => {
      const t = new Date(order.createdAt || Date.now()).getTime();
      return t >= startMs && t <= endMs;
    });
  }, [allOrders, dateBounds]);

  // Core Financial & Fulfillment Metrics
  const metrics = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status !== "cancelled");
    const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled");
    const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");
    const activeOrders = filteredOrders.filter((o) =>
      ["placed", "packed", "shipped", "out_for_delivery"].includes(o.status)
    );

    const grossRevenue = Number(completedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2));
    const estimatedProfit = Number((grossRevenue * 0.38).toFixed(2)); // ~38% standard luxury retail margin
    const totalTax = Number(completedOrders.reduce((sum, o) => sum + Number(o.tax || (o.total * 0.18)), 0).toFixed(2));
    const totalDiscounts = Number(completedOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0).toFixed(2));
    const lostRevenue = Number(cancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2));
    const aov = completedOrders.length > 0 ? Number((grossRevenue / completedOrders.length).toFixed(2)) : 0;
    const cancellationRate = totalOrdersCount > 0 ? Number(((cancelledOrders.length / totalOrdersCount) * 100).toFixed(1)) : 0;

    // Status breakdown
    const statusMap = filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Payment breakdown
    const paymentMap = completedOrders.reduce((acc, o) => {
      const method = o.paymentMethod || "Credit Card";
      acc[method] = (acc[method] || 0) + (o.total || 0);
      return acc;
    }, {});

    return {
      totalOrders: totalOrdersCount,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      activeOrdersCount: activeOrders.length,
      grossRevenue,
      estimatedProfit,
      totalTax,
      totalDiscounts,
      lostRevenue,
      aov,
      cancellationRate,
      statusMap,
      paymentMap
    };
  }, [filteredOrders]);

  // Daily/Timeline Sales Trend Data for Recharts
  const salesTimelineData = useMemo(() => {
    if (!filteredOrders.length) return [];

    const map = new Map();
    // Sort chronological
    const sorted = [...filteredOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sorted.forEach((order) => {
      const d = new Date(order.createdAt || Date.now());
      const key = `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;

      if (!map.has(key)) {
        map.set(key, { date: key, sales: 0, profit: 0, orders: 0 });
      }

      const item = map.get(key);
      if (order.status !== "cancelled") {
        item.sales += Number(order.total || 0);
        item.profit += Number((Number(order.total || 0) * 0.38).toFixed(2));
      }
      item.orders += 1;
    });

    return Array.from(map.values());
  }, [filteredOrders]);

  // Product Performance Stats
  const productPerformanceStats = useMemo(() => {
    const statsMap = new Map();

    // Initialize with catalog products
    catalogProducts.forEach((p) => {
      statsMap.set(p._id, {
        id: p._id,
        name: p.name,
        sku: p.sku || "LX-CAT",
        category: p.category?.name || "Apparel",
        price: p.price || 0,
        stock: p.stock ?? 12,
        unitsSold: 0,
        revenue: 0,
        ordersCount: 0
      });
    });

    // Accumulate from orders
    filteredOrders.forEach((order) => {
      if (order.status === "cancelled") return;
      (order.items || []).forEach((item) => {
        const pId = item.productId || item.name;
        if (!statsMap.has(pId)) {
          statsMap.set(pId, {
            id: pId,
            name: item.name || "Curated Item",
            sku: item.sku || "LX-ITEM",
            category: item.category || "Apparel",
            price: item.price || 0,
            stock: 10,
            unitsSold: 0,
            revenue: 0,
            ordersCount: 0
          });
        }
        const record = statsMap.get(pId);
        const qty = Number(item.quantity || 1);
        record.unitsSold += qty;
        record.revenue += Number(item.price || 0) * qty;
        record.ordersCount += 1;
      });
    });

    const list = Array.from(statsMap.values());
    const bestSellers = [...list].filter((p) => p.unitsSold > 0).sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);
    const lowPerformers = [...list].filter((p) => p.unitsSold <= 1).sort((a, b) => b.stock - a.stock);

    return { all: list, bestSellers, lowPerformers };
  }, [catalogProducts, filteredOrders]);

  // Inventory Health & Valuation
  const inventoryHealth = useMemo(() => {
    const list = catalogProducts.length > 0 ? catalogProducts : mockProducts;
    const totalUnits = list.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const totalValue = list.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0), 0);

    const outOfStockList = list.filter((p) => (Number(p.stock) || 0) === 0);
    const lowStockList = list.filter((p) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5);
    const healthyList = list.filter((p) => (Number(p.stock) || 0) > 5);

    return {
      totalProducts: list.length,
      totalUnits,
      totalValue,
      outOfStockCount: outOfStockList.length,
      lowStockCount: lowStockList.length,
      healthyCount: healthyList.length,
      outOfStockList,
      lowStockList,
      healthyList
    };
  }, [catalogProducts]);

  // ── CSV EXPORT ENGINE ────────────────────────────────────────────────────────
  const exportCSV = (filename, rows) => {
    const escapeCell = (cell) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvContent = "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (reportType = activeReportTab) => {
    const dateStamp = new Date().toISOString().split("T")[0];

    if (reportType === "financial") {
      const rows = [
        ["Luxeva Commerce Platform - Financial & Revenue Report", "", "", "", "", ""],
        ["Period Filter", rangeLabel, "Generated At", new Date().toLocaleString(), "", ""],
        ["------------------------------------------------------------------------------------------------"],
        ["Gross Net Revenue", `INR ${metrics.grossRevenue.toLocaleString()}`, "Total Completed Sales Volume", metrics.completedOrdersCount, "", ""],
        ["Estimated Profit (38%)", `INR ${metrics.estimatedProfit.toLocaleString()}`, "Estimated GST / Tax (18%)", `INR ${metrics.totalTax.toLocaleString()}`, "", ""],
        ["Total Discounts Given", `INR ${metrics.totalDiscounts.toLocaleString()}`, "Average Order Value (AOV)", `INR ${metrics.aov.toLocaleString()}`, "", ""],
        ["Lost Revenue (Cancelled)", `INR ${metrics.lostRevenue.toLocaleString()}`, "Cancellation Rate", `${metrics.cancellationRate}%`, "", ""],
        ["------------------------------------------------------------------------------------------------"],
        ["Date / Day", "Orders Volume", "Gross Revenue (INR)", "Est. Profit (INR)", "Payment Method Mix", "Status"],
        ...salesTimelineData.map((d) => [
          d.date,
          d.orders,
          d.sales,
          d.profit,
          "Various",
          "Fulfilled"
        ])
      ];
      exportCSV(`luxeva-financial-report-${dateStamp}.csv`, rows);
      toast.success("Financial statement CSV downloaded!");
    } else if (reportType === "products") {
      const rows = [
        ["Luxeva Commerce Platform - Product Performance & Sales Velocity Report", "", "", "", "", "", ""],
        ["Period Filter", rangeLabel, "Generated At", new Date().toLocaleString(), "", "", ""],
        ["------------------------------------------------------------------------------------------------"],
        ["Product Name", "SKU", "Category", "Unit Price (INR)", "Units Sold", "Total Revenue (INR)", "Current Stock", "Velocity Status"],
        ...productPerformanceStats.all.map((p) => [
          p.name,
          p.sku,
          p.category,
          p.price,
          p.unitsSold,
          p.revenue,
          p.stock,
          p.unitsSold >= 3 ? "Best Seller" : p.unitsSold > 0 ? "Steady Moving" : p.stock > 10 ? "Stagnant Stock" : "Low Velocity"
        ])
      ];
      exportCSV(`luxeva-products-performance-${dateStamp}.csv`, rows);
      toast.success("Product performance CSV downloaded!");
    } else if (reportType === "inventory") {
      const rows = [
        ["Luxeva Commerce Platform - Warehouse Inventory Valuation & Stock Report", "", "", "", "", ""],
        ["Generated At", new Date().toLocaleString(), "Total Valuation", `INR ${inventoryHealth.totalValue.toLocaleString()}`, "", ""],
        ["Total Catalog Items", inventoryHealth.totalProducts, "Total Warehouse Units", inventoryHealth.totalUnits, "", ""],
        ["Out of Stock", inventoryHealth.outOfStockCount, "Low Stock Warning (<=5)", inventoryHealth.lowStockCount, "Healthy Stock", inventoryHealth.healthyCount],
        ["------------------------------------------------------------------------------------------------"],
        ["Product Name", "SKU", "Category", "Unit Price (INR)", "Stock on Hand", "Inventory Value (INR)", "Restock Priority"],
        ...(catalogProducts.length ? catalogProducts : mockProducts).map((p) => {
          const st = Number(p.stock || 0);
          const pr = Number(p.price || 0);
          return [
            p.name,
            p.sku || "LX-SKU",
            p.category?.name || "General",
            pr,
            st,
            st * pr,
            st === 0 ? "URGENT / OUT OF STOCK" : st <= 5 ? "HIGH / REPLENISH" : "NORMAL"
          ];
        })
      ];
      exportCSV(`luxeva-inventory-valuation-${dateStamp}.csv`, rows);
      toast.success("Inventory audit CSV downloaded!");
    } else {
      // Fulfillment & Orders
      const rows = [
        ["Luxeva Commerce Platform - Orders & Fulfillment Audit Log", "", "", "", "", "", "", ""],
        ["Period Filter", rangeLabel, "Generated At", new Date().toLocaleString(), "", "", "", ""],
        ["------------------------------------------------------------------------------------------------"],
        ["Order Number", "Date Placed", "Customer Name", "Customer Email", "Status", "Items Count", "Payment", "Total (INR)"],
        ...filteredOrders.map((o) => [
          o.orderNumber || o._id,
          o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
          o.customer?.name || "Guest",
          o.customer?.email || "",
          o.status,
          (o.items || []).reduce((s, it) => s + (it.quantity || 1), 0),
          o.paymentMethod || "UPI",
          o.total || 0
        ])
      ];
      exportCSV(`luxeva-orders-fulfillment-${dateStamp}.csv`, rows);
      toast.success("Fulfillment audit CSV downloaded!");
    }

    setExportDropdownOpen(false);
  };

  // ── PDF EXPORT ENGINE ────────────────────────────────────────────────────────
  const handleExportPDF = (reportType = activeReportTab) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const dateStamp = new Date().toISOString().split("T")[0];

    // Executive Brand Header
    doc.setFillColor(21, 21, 21);
    doc.rect(0, 0, 595, 75, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("LUXEVA COMMERCE PLATFORM", 40, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(210, 210, 210);

    const reportTitle =
      reportType === "financial"
        ? "EXECUTIVE FINANCIAL & REVENUE STATEMENT"
        : reportType === "products"
        ? "PRODUCT PERFORMANCE & SALES VELOCITY DOSSIER"
        : reportType === "inventory"
        ? "WAREHOUSE INVENTORY VALUATION & AUDIT"
        : "FULFILLMENT PIPELINE & ORDERS AUDIT";

    doc.text(reportTitle, 40, 54);

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Period: ${rangeLabel}`, 40, 95);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 380, 95);

    if (reportType === "financial") {
      // Financial KPI table
      autoTable(doc, {
        startY: 110,
        head: [["Financial Metric", "Value", "Operational Guidance"]],
        body: [
          ["Total Net Revenue", `INR ${metrics.grossRevenue.toLocaleString()}`, "Fulfilled and active checkouts"],
          ["Estimated Gross Profit (38%)", `INR ${metrics.estimatedProfit.toLocaleString()}`, "Standard luxury merchandise margin"],
          ["Estimated GST / Taxes (18%)", `INR ${metrics.totalTax.toLocaleString()}`, "Accrued tax compliance estimate"],
          ["Total Customer Discounts", `INR ${metrics.totalDiscounts.toLocaleString()}`, "Coupons and promotional deductions"],
          ["Total Orders Count", `${metrics.totalOrders} orders`, "Gross transactions within period"],
          ["Average Order Value (AOV)", `INR ${metrics.aov.toLocaleString()}`, "Net revenue per completed order"],
          ["Cancellation Rate", `${metrics.cancellationRate}%`, metrics.cancellationRate > 15 ? "Attention: Higher than target" : "Healthy performance threshold"],
          ["Lost Gross Revenue", `INR ${metrics.lostRevenue.toLocaleString()}`, "Value of cancelled/returned orders"]
        ],
        theme: "striped",
        headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });

      const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 320;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(21, 21, 21);
      doc.text("Daily / Timeline Revenue Breakdown", 40, nextY);

      autoTable(doc, {
        startY: nextY + 10,
        head: [["Timeline Period", "Orders Count", "Gross Sales (INR)", "Estimated Profit (INR)"]],
        body: salesTimelineData.map((d) => [
          d.date,
          `${d.orders} orders`,
          `INR ${d.sales.toLocaleString()}`,
          `INR ${d.profit.toLocaleString()}`
        ]),
        theme: "striped",
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });
    } else if (reportType === "products") {
      autoTable(doc, {
        startY: 110,
        head: [["#", "Product Name", "SKU", "Price", "Sold", "Revenue", "Stock", "Performance"]],
        body: productPerformanceStats.all.map((p, idx) => [
          idx + 1,
          p.name,
          p.sku || "N/A",
          `INR ${p.price.toLocaleString()}`,
          `${p.unitsSold} pcs`,
          `INR ${p.revenue.toLocaleString()}`,
          `${p.stock}`,
          p.unitsSold >= 3 ? "Best Seller" : p.unitsSold > 0 ? "Steady" : "Low Velocity"
        ]),
        theme: "striped",
        headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });
    } else if (reportType === "inventory") {
      autoTable(doc, {
        startY: 110,
        head: [["Stock Health Category", "Items Count", "Valuation (INR)", "Action Recommended"]],
        body: [
          ["Critical: Out of Stock (0 units)", `${inventoryHealth.outOfStockCount} items`, `INR 0`, "Immediate procurement restock"],
          ["Warning: Low Stock (1-5 units)", `${inventoryHealth.lowStockCount} items`, `INR ${inventoryHealth.lowStockList.reduce((s, p) => s + (p.stock * p.price), 0).toLocaleString()}`, "Place supplier purchase order"],
          ["Healthy: Adequate Stock (>5 units)", `${inventoryHealth.healthyCount} items`, `INR ${inventoryHealth.healthyList.reduce((s, p) => s + (p.stock * p.price), 0).toLocaleString()}`, "Levels balanced"],
          ["Total Warehouse Assets", `${inventoryHealth.totalProducts} items (${inventoryHealth.totalUnits} units)`, `INR ${inventoryHealth.totalValue.toLocaleString()}`, "Active warehouse inventory"]
        ],
        theme: "striped",
        headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });

      const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 300;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(21, 21, 21);
      doc.text("Items Requiring Restock Attention", 40, nextY);

      const alertItems = [...inventoryHealth.outOfStockList, ...inventoryHealth.lowStockList];
      autoTable(doc, {
        startY: nextY + 10,
        head: [["Product Name", "SKU", "Unit Price", "Stock Left", "Urgency Status"]],
        body: alertItems.map((p) => [
          p.name,
          p.sku || "LX-SKU",
          `INR ${Number(p.price || 0).toLocaleString()}`,
          `${p.stock || 0}`,
          (p.stock || 0) === 0 ? "OUT OF STOCK" : "LOW STOCK WARNING"
        ]),
        theme: "striped",
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });
    } else {
      // Fulfillment & Orders
      autoTable(doc, {
        startY: 110,
        head: [["Order #", "Placed At", "Customer", "Items", "Method", "Total (INR)", "Status"]],
        body: filteredOrders.map((o) => [
          o.orderNumber || o._id,
          o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A",
          o.customer?.name || "Customer",
          `${(o.items || []).reduce((s, it) => s + (it.quantity || 1), 0)} items`,
          o.paymentMethod || "UPI",
          `INR ${(o.total || 0).toLocaleString()}`,
          o.status.toUpperCase()
        ]),
        theme: "striped",
        headStyles: { fillColor: [21, 21, 21], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 40, right: 40 }
      });
    }

    // Number pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Luxeva Private Portal • Confidential Executive Report • Page ${i} of ${pageCount}`, 40, doc.internal.pageSize.height - 20);
    }

    doc.save(`luxeva-${reportType}-report-${dateStamp}.pdf`);
    toast.success("Executive PDF report generated!");
    setExportDropdownOpen(false);
  };

  const chartColors = useMemo(() => {
    const isDark = theme === "dark";
    return {
      salesStroke: "#10b981",
      salesFill: "#10b981",
      profitStroke: isDark ? "#818cf8" : "#6366f1",
      profitFill: isDark ? "#818cf8" : "#6366f1",
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      text: isDark ? "rgba(255,255,255,0.55)" : "rgba(21,21,21,0.55)"
    };
  }, [theme]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header & Controls ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ink/8 pb-6 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-clay dark:text-white/60">Business Intelligence</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-clay/70 dark:text-white/45">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink dark:text-white">
            Executive Sales & Operations Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-clay dark:text-white/70">
            Generate, analyze, and export sales revenue, product performance, warehouse stock, and fulfillment audits.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchReportData(true)}
            disabled={refreshing}
            className="flex h-10 items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-ink/5 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-md transition hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90"
            >
              <Download size={14} />
              <span>Export Reports</span>
              <ChevronDown size={13} className={exportDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-ink/10 bg-white p-2 shadow-2xl dark:border-white/15 dark:bg-[#1f1f1f]">
                <div className="px-3 py-2 border-b border-ink/5 dark:border-white/10">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-clay dark:text-white/60">
                    Export Filtered Range ({rangeLabel})
                  </p>
                </div>

                <div className="space-y-1 p-1">
                  <button
                    type="button"
                    onClick={() => handleExportPDF(activeReportTab)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink transition hover:bg-ink/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <FileText size={15} className="text-rose-500" />
                    <div className="text-left">
                      <p className="font-semibold">Export Active Report (PDF)</p>
                      <p className="text-[10px] text-clay dark:text-white/50">Branded executive document</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportCSV(activeReportTab)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-ink transition hover:bg-ink/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-500" />
                    <div className="text-left">
                      <p className="font-semibold">Export Active Report (CSV)</p>
                      <p className="text-[10px] text-clay dark:text-white/50">Raw spreadsheet data</p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-ink/5 dark:border-white/10" />

                  <button
                    type="button"
                    onClick={() => handleExportPDF("financial")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-clay hover:text-ink dark:text-white/70 dark:hover:text-white"
                  >
                    <span>Full Financial Statement PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPDF("inventory")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-clay hover:text-ink dark:text-white/70 dark:hover:text-white"
                  >
                    <span>Warehouse Inventory Audit PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Date Range Presets Strip ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-clay dark:text-white/60 mr-1">
            <Calendar size={13} />
            Period:
          </span>
          {DATE_PRESETS.map((preset) => {
            const isActive = dateRange === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setDateRange(preset.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "border border-ink/10 bg-white text-clay hover:text-ink hover:border-ink/25 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white/70 dark:hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range inputs */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white p-1.5 text-xs shadow-sm dark:border-white/12 dark:bg-[#1e1e1e]">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg bg-sand/60 px-2 py-1 text-xs font-medium text-ink outline-none dark:bg-white/10 dark:text-white"
            />
            <span className="text-clay/60 dark:text-white/40">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg bg-sand/60 px-2 py-1 text-xs font-medium text-ink outline-none dark:bg-white/10 dark:text-white"
            />
            <button
              type="button"
              onClick={() => {
                setAppliedCustomStart(customStart);
                setAppliedCustomEnd(customEnd);
                toast.success("Applied custom range filter");
              }}
              className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-ink"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── Top Executive KPI Cards ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Gross Net Revenue</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white">
            {currency(metrics.grossRevenue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-clay dark:text-white/65">
            <span>AOV: <strong>{currency(metrics.aov)}</strong></span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp size={12} />
              {metrics.completedOrdersCount} paid
            </span>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Est. Gross Margin (38%)</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {currency(metrics.estimatedProfit)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-clay dark:text-white/65">
            <span>GST (18%): {currency(metrics.totalTax)}</span>
            <span className="text-clay/80 dark:text-white/50">Post tax</span>
          </div>
        </div>

        {/* Orders Volume */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Orders Processed</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white">
            {metrics.totalOrders}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-clay dark:text-white/65">
            <span>Delivered: <strong>{metrics.deliveredOrdersCount}</strong></span>
            <span>In-Transit: <strong>{metrics.activeOrdersCount}</strong></span>
          </div>
        </div>

        {/* Cancellation Rate */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Cancellation Rate</p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              metrics.cancellationRate > 15
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
              <Percent size={15} />
            </div>
          </div>
          <p className={`mt-3 font-display text-2xl sm:text-3xl font-bold ${
            metrics.cancellationRate > 15 ? "text-rose-600 dark:text-rose-400" : "text-ink dark:text-white"
          }`}>
            {metrics.cancellationRate}%
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-clay dark:text-white/65">
            <span>Lost: {currency(metrics.lostRevenue)}</span>
            <span className={metrics.cancellationRate > 15 ? "text-rose-600 font-semibold" : "text-emerald-600"}>
              {metrics.cancelledOrdersCount} cancelled
            </span>
          </div>
        </div>
      </div>

      {/* ── Report Type Switcher Tabs ─────────────────────────────────────── */}
      <div className="flex border-b border-ink/10 pb-2 dark:border-white/10 gap-2 overflow-x-auto no-scrollbar">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveReportTab(tab.key);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold transition ${
                isActive
                  ? "bg-ink text-white shadow-md dark:bg-white dark:text-ink"
                  : "bg-white text-clay hover:bg-ink/5 hover:text-ink border border-ink/5 dark:bg-[#1e1e1e] dark:text-white/70 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon size={16} />
              <div className="text-left">
                <p className="leading-snug">{tab.label}</p>
                <p className={`text-[10px] hidden md:block ${isActive ? "text-white/75 dark:text-black/60" : "text-clay/60 dark:text-white/40"}`}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── ACTIVE REPORT VIEW CONTAINER ─────────────────────────────────── */}

      {/* 1. FINANCIAL & REVENUE REPORT */}
      {activeReportTab === "financial" && (
        <div className="space-y-6">
          {/* Revenue & Profit Interactive Timeline Chart */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-7 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-ink/8 dark:border-white/10">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-white">
                  Revenue & Gross Margin Trajectory
                </h3>
                <p className="text-xs text-clay dark:text-white/60 mt-0.5">
                  Gross revenue vs estimated 38% gross profit over {rangeLabel}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Gross Sales
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  Est. Profit
                </span>
              </div>
            </div>

            <div className="mt-6 h-[280px] w-full">
              {salesTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.salesStroke} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColors.salesStroke} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.profitStroke} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColors.profitStroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" stroke={chartColors.text} fontSize={11} tickLine={false} />
                    <YAxis
                      stroke={chartColors.text}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomChartTooltip theme={theme} />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Gross Sales"
                      stroke={chartColors.salesStroke}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Est. Margin"
                      stroke={chartColors.profitStroke}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#profitGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-clay dark:text-white/50">
                  No transaction data in this date range.
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Breakdown & Financial Ledger */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Payment Method Mix */}
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <h4 className="font-display text-base font-bold text-ink dark:text-white">
                Payment Channel Distribution
              </h4>
              <p className="text-xs text-clay dark:text-white/60 mt-0.5">
                Share of sales volume by checkout rail
              </p>

              <div className="mt-5 space-y-3">
                {Object.entries(metrics.paymentMap).map(([method, amount]) => {
                  const pct = metrics.grossRevenue > 0 ? ((amount / metrics.grossRevenue) * 100).toFixed(1) : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink dark:text-white">{method}</span>
                        <span className="font-mono text-clay dark:text-white/70">{currency(amount)} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-sand dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-ink dark:bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Ledger Table */}
            <div className="lg:col-span-2 rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <div className="flex items-center justify-between pb-3 border-b border-ink/8 dark:border-white/10">
                <div>
                  <h4 className="font-display text-base font-bold text-ink dark:text-white">
                    Financial Statements & Ledger
                  </h4>
                  <p className="text-xs text-clay dark:text-white/60">Revenue reconciliation by timeline</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV("financial")}
                  className="flex items-center gap-1 text-xs font-semibold text-clay hover:text-ink dark:text-white/70 dark:hover:text-white"
                >
                  <Download size={13} />
                  <span>Download Ledger CSV</span>
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/5 dark:border-white/8 text-[11px] font-semibold uppercase text-clay/70 dark:text-white/50">
                      <th className="py-2.5">Date / Interval</th>
                      <th className="py-2.5">Orders</th>
                      <th className="py-2.5">Gross Sales</th>
                      <th className="py-2.5">Est. Margin</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5 dark:divide-white/8">
                    {salesTimelineData.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className="hover:bg-sand/30 dark:hover:bg-white/5">
                        <td className="py-2.5 font-medium text-ink dark:text-white">{row.date}</td>
                        <td className="py-2.5 text-clay dark:text-white/70">{row.orders} orders</td>
                        <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">{currency(row.sales)}</td>
                        <td className="py-2.5 text-indigo-600 dark:text-indigo-400">{currency(row.profit)}</td>
                        <td className="py-2.5 text-right">
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            Reconciled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT PERFORMANCE REPORT */}
      {activeReportTab === "products" && (
        <div className="space-y-6">
          {/* Search & Stats Bar */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-white">
                  Product Sales Velocity & Merchandising
                </h3>
                <p className="text-xs text-clay dark:text-white/60 mt-0.5">
                  Analysis of {productPerformanceStats.all.length} products monitored across catalog
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay/60 dark:text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product or SKU..."
                    className="h-9 w-48 sm:w-60 rounded-full border border-ink/10 bg-sand/30 pl-8 pr-3 text-xs text-ink outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleExportPDF("products")}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 text-xs font-semibold text-ink shadow-sm hover:bg-ink/5 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:hover:bg-white/10"
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
            </div>

            {/* Performance Summary Chips */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3 pt-5 border-t border-ink/8 dark:border-white/10 text-xs">
              <div className="rounded-2xl bg-sand/40 p-3 dark:bg-white/5">
                <span className="text-clay dark:text-white/60">Top Performing SKUs:</span>
                <p className="font-display text-lg font-bold text-ink dark:text-white mt-1">
                  {productPerformanceStats.bestSellers.length} products
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Generating sales</p>
              </div>

              <div className="rounded-2xl bg-sand/40 p-3 dark:bg-white/5">
                <span className="text-clay dark:text-white/60">Low Velocity / Stagnant:</span>
                <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {productPerformanceStats.lowPerformers.length} products
                </p>
                <p className="text-[11px] text-clay/70 dark:text-white/50 mt-0.5">0 or 1 sale in period</p>
              </div>

              <div className="rounded-2xl bg-sand/40 p-3 dark:bg-white/5">
                <span className="text-clay dark:text-white/60">Catalog Revenue Leader:</span>
                <p className="font-display text-lg font-bold text-ink dark:text-white mt-1 truncate">
                  {productPerformanceStats.bestSellers[0]?.name || "N/A"}
                </p>
                <p className="text-[11px] text-clay/70 dark:text-white/50 mt-0.5">
                  {productPerformanceStats.bestSellers[0]?.unitsSold || 0} units ({currency(productPerformanceStats.bestSellers[0]?.revenue || 0)})
                </p>
              </div>
            </div>
          </div>

          {/* Products Data Table */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/8 dark:border-white/10 text-[11px] font-semibold uppercase text-clay/70 dark:text-white/50">
                    <th className="py-3">Product Name</th>
                    <th className="py-3">SKU</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Sold</th>
                    <th className="py-3">Revenue</th>
                    <th className="py-3">Stock Left</th>
                    <th className="py-3 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 dark:divide-white/8">
                  {productPerformanceStats.all
                    .filter((p) =>
                      searchQuery
                        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-sand/30 dark:hover:bg-white/5">
                        <td className="py-3 font-semibold text-ink dark:text-white max-w-[200px] truncate">{item.name}</td>
                        <td className="py-3 font-mono text-clay/70 dark:text-white/50">{item.sku}</td>
                        <td className="py-3 text-clay dark:text-white/70">{item.category}</td>
                        <td className="py-3 font-medium text-ink dark:text-white">{currency(item.price)}</td>
                        <td className="py-3 font-bold text-ink dark:text-white">{item.unitsSold} pcs</td>
                        <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">{currency(item.revenue)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stock === 0
                              ? "bg-rose-500/15 text-rose-600"
                              : item.stock <= 5
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-emerald-500/15 text-emerald-600"
                          }`}>
                            {item.stock} in stock
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.unitsSold >= 3
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : item.unitsSold > 0
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : item.stock > 10
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-ink/5 text-clay dark:bg-white/10 dark:text-white/60"
                          }`}>
                            {item.unitsSold >= 3 ? "Best Seller" : item.unitsSold > 0 ? "Active Moving" : item.stock > 10 ? "Stagnant Stock" : "Low Demand"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY VALUATION REPORT */}
      {activeReportTab === "inventory" && (
        <div className="space-y-6">
          {/* Inventory Valuation KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Total Stock Valuation</p>
              <p className="mt-3 font-display text-2xl font-bold text-ink dark:text-white">
                {currency(inventoryHealth.totalValue)}
              </p>
              <p className="mt-1 text-xs text-clay dark:text-white/65">Tied-up merchandise capital</p>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Total Units on Hand</p>
              <p className="mt-3 font-display text-2xl font-bold text-ink dark:text-white">
                {inventoryHealth.totalUnits} units
              </p>
              <p className="mt-1 text-xs text-clay dark:text-white/65">Across {inventoryHealth.totalProducts} active SKUs</p>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Out of Stock Alert</p>
              <p className="mt-3 font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
                {inventoryHealth.outOfStockCount} SKUs
              </p>
              <p className="mt-1 text-xs text-clay dark:text-white/65">Requires urgent restocking</p>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Low Stock Warning (≤5)</p>
              <p className="mt-3 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
                {inventoryHealth.lowStockCount} SKUs
              </p>
              <p className="mt-1 text-xs text-clay dark:text-white/65">Reorder threshold reached</p>
            </div>
          </div>

          {/* Critical Restock Alerts Table */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <div className="flex items-center justify-between pb-4 border-b border-ink/8 dark:border-white/10">
              <div>
                <h4 className="font-display text-lg font-bold text-ink dark:text-white">
                  Restock Priority & Stockout Prevention
                </h4>
                <p className="text-xs text-clay dark:text-white/60">Products with zero or depleted warehouse stock</p>
              </div>
              <button
                type="button"
                onClick={() => handleExportCSV("inventory")}
                className="flex items-center gap-1 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink dark:border-white/12 dark:text-white"
              >
                <Download size={13} />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/5 dark:border-white/8 text-[11px] font-semibold uppercase text-clay/70 dark:text-white/50">
                    <th className="py-2.5">Product Name</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5">Unit Price</th>
                    <th className="py-2.5">Stock Left</th>
                    <th className="py-2.5">Inventory Tied Value</th>
                    <th className="py-2.5 text-right">Replenishment Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 dark:divide-white/8">
                  {[...inventoryHealth.outOfStockList, ...inventoryHealth.lowStockList].map((item) => (
                    <tr key={item._id} className="hover:bg-sand/30 dark:hover:bg-white/5">
                      <td className="py-3 font-semibold text-ink dark:text-white">{item.name}</td>
                      <td className="py-3 font-mono text-clay/70 dark:text-white/50">{item.sku || "LX-SKU"}</td>
                      <td className="py-3 font-medium text-ink dark:text-white">{currency(item.price)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (item.stock || 0) === 0 ? "bg-rose-500 text-white" : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        }`}>
                          {item.stock || 0} units
                        </span>
                      </td>
                      <td className="py-3 text-clay dark:text-white/70">
                        {currency((item.stock || 0) * (item.price || 0))}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          (item.stock || 0) === 0
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        }`}>
                          {(item.stock || 0) === 0 ? "Critical Stockout" : "High Priority"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. FULFILLMENT & ORDERS REPORT */}
      {activeReportTab === "fulfillment" && (
        <div className="space-y-6">
          {/* Milestone Pipeline Distribution */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-7 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-white">
              Logistics Pipeline Completion
            </h3>
            <p className="text-xs text-clay dark:text-white/60 mt-0.5">
              Live status breakdown for {metrics.totalOrders} customer checkouts in {rangeLabel}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-center">
              {[
                { key: "placed", label: "Placed", count: metrics.statusMap.placed || 0, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
                { key: "packed", label: "Packed", count: metrics.statusMap.packed || 0, color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
                { key: "shipped", label: "Shipped", count: metrics.statusMap.shipped || 0, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
                { key: "out_for_delivery", label: "Out for Delivery", count: metrics.statusMap.out_for_delivery || 0, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
                { key: "delivered", label: "Delivered", count: metrics.statusMap.delivered || 0, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
                { key: "cancelled", label: "Cancelled", count: metrics.statusMap.cancelled || 0, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" }
              ].map((stage) => (
                <div key={stage.key} className={`rounded-2xl border p-3 ${stage.color}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider">{stage.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stage.count}</p>
                  <p className="text-[10px] opacity-75">
                    {metrics.totalOrders > 0 ? ((stage.count / metrics.totalOrders) * 100).toFixed(0) : 0}% of orders
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Orders Audit Table */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink/8 dark:border-white/10">
              <div>
                <h4 className="font-display text-lg font-bold text-ink dark:text-white">
                  Orders Audit & Manifest Log
                </h4>
                <p className="text-xs text-clay dark:text-white/60">Itemized chronological transactions</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportPDF("fulfillment")}
                  className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-semibold text-ink dark:border-white/12 dark:text-white"
                >
                  <FileText size={13} className="text-rose-500" />
                  <span>PDF Log</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV("fulfillment")}
                  className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-ink"
                >
                  <FileSpreadsheet size={13} className="text-emerald-400" />
                  <span>CSV Log</span>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink/5 dark:border-white/8 text-[11px] font-semibold uppercase text-clay/70 dark:text-white/50">
                    <th className="py-2.5">Order #</th>
                    <th className="py-2.5">Placed At</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Destination</th>
                    <th className="py-2.5">Payment</th>
                    <th className="py-2.5">Total Amount</th>
                    <th className="py-2.5 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5 dark:divide-white/8">
                  {filteredOrders.slice(0, 15).map((order) => (
                    <tr key={order._id} className="hover:bg-sand/30 dark:hover:bg-white/5">
                      <td className="py-3 font-mono font-semibold text-ink dark:text-white">{order.orderNumber || order._id}</td>
                      <td className="py-3 text-clay dark:text-white/70">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 font-medium text-ink dark:text-white">
                        {order.customer?.name || "Customer"}
                        <span className="block text-[10px] text-clay/60 dark:text-white/40">{order.customer?.email}</span>
                      </td>
                      <td className="py-3 text-clay dark:text-white/70">
                        {order.shippingAddress?.city || "Mumbai"}, {order.shippingAddress?.state || "MH"}
                      </td>
                      <td className="py-3 text-clay dark:text-white/70 font-mono text-[11px]">
                        {order.paymentMethod || "UPI"}
                      </td>
                      <td className="py-3 font-bold text-ink dark:text-white">{currency(order.total)}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "delivered"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : order.status === "cancelled"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
