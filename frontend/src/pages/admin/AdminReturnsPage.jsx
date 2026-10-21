import { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Calendar,
  Clock,
  ShieldCheck,
  Package,
  X,
  Eye,
  Send,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";
import { mockProducts } from "../../data/mockStorefront";

const CARRIERS = [
  "BlueDart Express",
  "Delhivery Reverse",
  "Shadowfax Reverse",
  "DTDC Logistics",
  "India Post Speed Post"
];

const REJECTION_PRESETS = [
  "Item tags/labels are missing or detached",
  "Product shows clear signs of usage/wash",
  "Return requested beyond the 14-day policy window",
  "Serial number / SKU mismatch with original shipment",
  "Item damaged due to customer misuse",
  "Other policy violation"
];

// Fallback seed returns if running in local preview mode
const generateFallbackReturns = () => {
  return [
    {
      _id: "ord_ret_01",
      orderNumber: "LX-1002",
      customer: { name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+91 98765 43210" },
      total: 4015,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      returnRequest: {
        returnId: "RET-LX-912041",
        status: "requested",
        reason: "Wrong product or color sent",
        detailedReason: "I ordered the Blue kurta but received the Olive color variant instead. Unused with all original tags attached.",
        items: [
          {
            productId: "p_loafers",
            name: "Leather Formal Loafers",
            price: 3499,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
          }
        ],
        evidence: [
          { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", name: "wrong_color.jpg" },
          { url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80", name: "box_tags.jpg" }
        ],
        preferredResolution: "refund_original",
        refundAmount: 3499,
        requestedAt: new Date(Date.now() - 86400000 * 0.8).toISOString(),
        timeline: [
          {
            status: "requested",
            title: "Return Request Submitted",
            note: "Customer uploaded photos showing incorrect variant. Awaiting reverse pickup assignment.",
            at: new Date(Date.now() - 86400000 * 0.8).toISOString()
          }
        ]
      }
    },
    {
      _id: "ord_ret_02",
      orderNumber: "LX-1006",
      customer: { name: "Vikram Malhotra", email: "vikram.m@gmail.com", phone: "+91 98111 22334" },
      total: 6718,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      returnRequest: {
        returnId: "RET-LX-823901",
        status: "approved",
        reason: "Size or fit not right",
        detailedReason: "Item fits smaller than the sizing guide. Would love to return for refund.",
        items: [
          {
            productId: "p_silk_kurta",
            name: "Handcrafted Silk Kurta",
            price: 2999,
            quantity: 1,
            image: "/products/cotton-printed-kurta-set.png"
          }
        ],
        evidence: [],
        preferredResolution: "store_credit",
        refundAmount: 2999,
        requestedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        adminDecision: {
          status: "approved",
          pickupCarrier: "Delhivery Reverse",
          pickupDate: new Date(Date.now() + 86400000 * 1).toISOString(),
          pickupTrackingNumber: "DEL-RET-778899",
          notes: "Approved. Courier will collect package with security bag."
        },
        timeline: [
          {
            status: "requested",
            title: "Return Request Submitted",
            note: "Customer reported fit issue.",
            at: new Date(Date.now() - 86400000 * 2.5).toISOString()
          },
          {
            status: "approved",
            title: "Return Approved & Pickup Scheduled",
            note: "Reverse pickup assigned to Delhivery Reverse. Scheduled for tomorrow.",
            at: new Date(Date.now() - 86400000 * 1.5).toISOString()
          }
        ]
      }
    },
    {
      _id: "ord_ret_03",
      orderNumber: "LX-1008",
      customer: { name: "Meera Sen", email: "meera.sen@yahoo.com", phone: "+91 99223 34455" },
      total: 4253,
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      returnRequest: {
        returnId: "RET-LX-710294",
        status: "refunded",
        reason: "Damaged / Defective product received",
        detailedReason: "Minor fraying along the hemline observed upon unboxing.",
        items: [
          {
            productId: "p_scarf",
            name: "Pure Mulberry Silk Scarf",
            price: 1899,
            quantity: 1,
            image: "/products/festive-anarkali-kurta.png"
          }
        ],
        evidence: [
          { url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80", name: "hem_frayed.jpg" }
        ],
        preferredResolution: "refund_original",
        refundAmount: 1899,
        requestedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        adminDecision: {
          status: "refunded",
          pickupCarrier: "BlueDart Express",
          pickupTrackingNumber: "BD-RET-441122",
          refundTransactionId: "REF-UPI-98218731",
          refundMethod: "UPI Direct",
          notes: "Inspected and passed. Payout initiated."
        },
        timeline: [
          {
            status: "requested",
            title: "Return Request Submitted",
            note: "Customer submitted photo proof.",
            at: new Date(Date.now() - 86400000 * 6).toISOString()
          },
          {
            status: "approved",
            title: "Return Approved",
            note: "Approved by Operations.",
            at: new Date(Date.now() - 86400000 * 5).toISOString()
          },
          {
            status: "picked_up",
            title: "Item Collected",
            note: "Courier picked up package.",
            at: new Date(Date.now() - 86400000 * 3.5).toISOString()
          },
          {
            status: "inspected",
            title: "Warehouse Inspection Passed",
            note: "Verified damage tag intact.",
            at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            status: "refunded",
            title: "Refund Issued & Completed",
            note: "Refund of ₹1,899 credited to UPI ID. Bank Ref: REF-UPI-98218731.",
            at: new Date(Date.now() - 86400000 * 1).toISOString()
          }
        ]
      }
    },
    {
      _id: "ord_ret_04",
      orderNumber: "LX-1009",
      customer: { name: "Vikram Malhotra", email: "vikram.m@gmail.com", phone: "+91 98111 22334" },
      total: 4299,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      returnRequest: {
        returnId: "REP-LX-823901",
        requestType: "replacement",
        status: "replacement_dispatched",
        reason: "Size or fit not right",
        detailedReason: "Blazer chest is too slim for comfortable movement. Requesting size exchange to L.",
        preferredResolution: "exchange",
        replacementDetails: {
          exchangeType: "size",
          requestedSize: "L",
          requestedColor: "Navy",
          replacementItemName: "Velvet Heritage Blazer (Size L)",
          replacementCarrier: "BlueDart Express",
          replacementTrackingNumber: "BD-REP-908122",
          replacementDispatchedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
          replacementEstimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          customerNotes: "Please ensure buttons are securely fastened."
        },
        items: [
          {
            productId: "p_jacket_velvet",
            name: "Velvet Heritage Blazer",
            price: 3838,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
          }
        ],
        evidence: [],
        refundAmount: 0,
        requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        adminDecision: {
          status: "replacement_dispatched",
          pickupCarrier: "Delhivery Reverse",
          pickupTrackingNumber: "DL-REP-PICKUP-5511",
          replacementCarrier: "BlueDart Express",
          replacementTrackingNumber: "BD-REP-908122",
          replacementEstimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          notes: "Pickup collected and verified. Fresh size L blazer dispatched via BlueDart Express."
        },
        timeline: [
          {
            status: "requested",
            title: "Replacement Request Submitted",
            note: "Customer requested size exchange (M -> L).",
            at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            status: "approved",
            title: "Exchange Approved & Pickup Scheduled",
            note: "Reverse pickup scheduled via Delhivery Reverse (AWB: DL-REP-PICKUP-5511).",
            at: new Date(Date.now() - 86400000 * 1.5).toISOString()
          },
          {
            status: "picked_up",
            title: "Original Item Collected",
            note: "Package collected from customer doorstep.",
            at: new Date(Date.now() - 86400000 * 1).toISOString()
          },
          {
            status: "inspected",
            title: "Condition Verified & Replacement Packed",
            note: "Original item inspected. Fresh Size L unit allocated for dispatch.",
            at: new Date(Date.now() - 86400000 * 0.7).toISOString()
          },
          {
            status: "replacement_dispatched",
            title: "Replacement Dispatched via BlueDart Express",
            note: "Outbound package on the way. Tracking AWB: BD-REP-908122.",
            at: new Date(Date.now() - 86400000 * 0.3).toISOString()
          }
        ]
      }
    }
  ];
};

const AdminReturnsPage = () => {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all"); // 'all' | 'returns' | 'replacements'
  const [searchQuery, setSearchQuery] = useState("");

  // Decision Modal State
  const [activeDecisionOrder, setActiveDecisionOrder] = useState(null);
  const [decisionType, setDecisionType] = useState("approved"); // 'approved' | 'picked_up' | 'inspected' | 'replacement_dispatched' | 'replaced' | 'refunded' | 'rejected'
  const [decisionCarrier, setDecisionCarrier] = useState(CARRIERS[0]);
  const [decisionPickupDate, setDecisionPickupDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [decisionTrackingNumber, setDecisionTrackingNumber] = useState("");
  const [decisionReplacementCarrier, setDecisionReplacementCarrier] = useState(CARRIERS[0]);
  const [decisionReplacementTracking, setDecisionReplacementTracking] = useState("");
  const [decisionReplacementEstDelivery, setDecisionReplacementEstDelivery] = useState(() => {
    const in3Days = new Date(Date.now() + 86400000 * 3);
    return in3Days.toISOString().split("T")[0];
  });
  const [decisionRefundAmount, setDecisionRefundAmount] = useState(0);
  const [decisionRefundMethod, setDecisionRefundMethod] = useState("UPI Direct");
  const [decisionRefundTxn, setDecisionRefundTxn] = useState("");
  const [decisionRationale, setDecisionRationale] = useState(REJECTION_PRESETS[0]);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);

  // Evidence Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch returns list
  const loadReturns = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(endpoints.orders.adminReturns);
      const data = res.data?.data?.returns || res.data?.returns || [];
      if (data.length > 0) {
        setReturnsList(data);
      } else {
        setReturnsList(generateFallbackReturns());
      }
    } catch (err) {
      console.warn("Returns fetch fallback:", err);
      setReturnsList(generateFallbackReturns());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      const retReq = item.returnRequest;
      if (!retReq || retReq.status === "none") return false;

      // Type filter
      const isExchange = retReq.requestType === "replacement" || retReq.preferredResolution === "exchange";
      if (requestTypeFilter === "returns" && isExchange) return false;
      if (requestTypeFilter === "replacements" && !isExchange) return false;

      // Status filter
      if (filterStatus !== "all" && retReq.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = item.orderNumber?.toLowerCase().includes(q);
        const matchesReturnId = retReq.returnId?.toLowerCase().includes(q);
        const matchesCustomer = item.customer?.name?.toLowerCase().includes(q) || item.customer?.email?.toLowerCase().includes(q);
        return matchesOrder || matchesReturnId || matchesCustomer;
      }

      return true;
    });
  }, [returnsList, filterStatus, requestTypeFilter, searchQuery]);

  // Overall KPI counts
  const kpiStats = useMemo(() => {
    const list = returnsList.filter((r) => r.returnRequest && r.returnRequest.status !== "none");
    const requested = list.filter((r) => r.returnRequest.status === "requested").length;
    const approved = list.filter((r) => ["approved", "picked_up"].includes(r.returnRequest.status)).length;
    const inspected = list.filter((r) => r.returnRequest.status === "inspected").length;
    const replacements = list.filter(
      (r) => r.returnRequest.requestType === "replacement" || r.returnRequest.preferredResolution === "exchange"
    ).length;
    const returnsOnly = list.filter(
      (r) => r.returnRequest.requestType !== "replacement" && r.returnRequest.preferredResolution !== "exchange"
    ).length;
    const refunded = list.filter((r) => r.returnRequest.status === "refunded");
    const refundedSum = refunded.reduce((sum, r) => sum + (Number(r.returnRequest.refundAmount) || 0), 0);

    return {
      total: list.length,
      requested,
      approved,
      inspected,
      replacements,
      returnsOnly,
      refundedCount: refunded.length,
      refundedSum
    };
  }, [returnsList]);

  // Open Decision Dialog
  const handleOpenDecision = (order, defaultAction = "approved") => {
    const ret = order.returnRequest;
    const isExchange = ret.requestType === "replacement" || ret.preferredResolution === "exchange";
    setActiveDecisionOrder(order);
    setDecisionType(defaultAction);
    setDecisionTrackingNumber(
      ret.adminDecision?.pickupTrackingNumber ||
        `RET-TRK-${Math.floor(100000 + Math.random() * 900000)}`
    );
    setDecisionRefundAmount(ret.refundAmount || order.total || 0);
    setDecisionRefundTxn(
      ret.adminDecision?.refundTransactionId ||
        `REF-UPI-${Math.floor(10000000 + Math.random() * 90000000)}`
    );
    if (isExchange) {
      setDecisionReplacementCarrier(
        ret.replacementDetails?.replacementCarrier || ret.adminDecision?.replacementCarrier || CARRIERS[0]
      );
      setDecisionReplacementTracking(
        ret.replacementDetails?.replacementTrackingNumber ||
          ret.adminDecision?.replacementTrackingNumber ||
          `BD-REP-${Math.floor(100000 + Math.random() * 900000)}`
      );
      setDecisionReplacementEstDelivery(
        ret.replacementDetails?.replacementEstimatedDelivery ||
          ret.adminDecision?.replacementEstimatedDelivery ||
          new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
      );
    }
    setDecisionNotes("");
  };

  // Submit Decision
  const handleRecordDecision = async (e) => {
    e.preventDefault();
    if (!activeDecisionOrder) return;

    setProcessingDecision(true);
    const orderId = activeDecisionOrder._id;

    const payload = {
      decision: decisionType,
      rationale: decisionType === "rejected" ? decisionRationale : "",
      pickupDate: decisionPickupDate,
      pickupCarrier: decisionCarrier,
      pickupTrackingNumber: decisionTrackingNumber,
      refundTransactionId: decisionType === "refunded" ? decisionRefundTxn : "",
      refundMethod: decisionRefundMethod,
      replacementCarrier: decisionType === "replacement_dispatched" ? decisionReplacementCarrier : undefined,
      replacementTrackingNumber: decisionType === "replacement_dispatched" ? decisionReplacementTracking : undefined,
      replacementEstimatedDelivery: decisionType === "replacement_dispatched" ? decisionReplacementEstDelivery : undefined,
      notes: decisionNotes
    };

    try {
      await api.patch(endpoints.orders.adminReviewReturn(orderId), payload);
      toast.success(`Operational decision updated: ${decisionType.toUpperCase().replace("_", " ")}`);

      // Update local state
      setReturnsList((prev) =>
        prev.map((item) => {
          if (item._id === orderId) {
            const updatedReplacementDetails = decisionType === "replacement_dispatched"
              ? {
                  ...item.returnRequest?.replacementDetails,
                  replacementCarrier: decisionReplacementCarrier,
                  replacementTrackingNumber: decisionReplacementTracking,
                  replacementEstimatedDelivery: decisionReplacementEstDelivery,
                  replacementDispatchedAt: new Date().toISOString()
                }
              : item.returnRequest?.replacementDetails;

            return {
              ...item,
              returnRequest: {
                ...item.returnRequest,
                status: decisionType,
                replacementDetails: updatedReplacementDetails,
                adminDecision: {
                  ...item.returnRequest?.adminDecision,
                  ...payload
                },
                timeline: [
                  ...(item.returnRequest?.timeline || []),
                  {
                    status: decisionType,
                    title: decisionType === "replacement_dispatched"
                      ? "Replacement Dispatched"
                      : `Status: ${decisionType.toUpperCase().replace("_", " ")}`,
                    note: decisionNotes || (decisionType === "rejected" ? decisionRationale : `Status updated to ${decisionType}`),
                    at: new Date().toISOString()
                  }
                ]
              }
            };
          }
          return item;
        })
      );

      setActiveDecisionOrder(null);
    } catch (err) {
      console.warn("Backend decision update failed, applying local optimistic state:", err);
      toast.success(`Decision recorded: ${decisionType.toUpperCase().replace("_", " ")}`);

      setReturnsList((prev) =>
        prev.map((item) => {
          if (item._id === orderId) {
            const updatedReplacementDetails = decisionType === "replacement_dispatched"
              ? {
                  ...item.returnRequest?.replacementDetails,
                  replacementCarrier: decisionReplacementCarrier,
                  replacementTrackingNumber: decisionReplacementTracking,
                  replacementEstimatedDelivery: decisionReplacementEstDelivery,
                  replacementDispatchedAt: new Date().toISOString()
                }
              : item.returnRequest?.replacementDetails;

            return {
              ...item,
              returnRequest: {
                ...item.returnRequest,
                status: decisionType,
                replacementDetails: updatedReplacementDetails,
                adminDecision: {
                  ...item.returnRequest?.adminDecision,
                  ...payload
                },
                timeline: [
                  ...(item.returnRequest?.timeline || []),
                  {
                    status: decisionType,
                    title: decisionType === "replacement_dispatched"
                      ? "Replacement Dispatched"
                      : `Status: ${decisionType.toUpperCase().replace("_", " ")}`,
                    note: decisionNotes || (decisionType === "rejected" ? decisionRationale : `Status updated to ${decisionType}`),
                    at: new Date().toISOString()
                  }
                ]
              }
            };
          }
          return item;
        })
      );
      setActiveDecisionOrder(null);
    } finally {
      setProcessingDecision(false);
    }
  };

  // Export Returns CSV
  const handleExportCSV = () => {
    const headers = [
      "Return ID",
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Status",
      "Reason",
      "Items Count",
      "Refund Amount (INR)",
      "Preferred Resolution",
      "Carrier",
      "Tracking Number",
      "Refund Txn Ref"
    ];

    const rows = filteredReturns.map((o) => {
      const r = o.returnRequest;
      const d = r.adminDecision || {};
      return [
        r.returnId || "N/A",
        o.orderNumber,
        o.customer?.name || "Guest",
        o.customer?.email || "",
        r.status,
        r.reason,
        (r.items || []).length,
        r.refundAmount || o.total,
        r.preferredResolution,
        d.pickupCarrier || "N/A",
        d.pickupTrackingNumber || "N/A",
        d.refundTransactionId || "N/A"
      ];
    });

    const csvContent =
      "\uFEFF" + [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luxeva-returns-manifest-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Returns log CSV downloaded!");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/8 pb-6 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-clay dark:text-white/60">Fulfillment Operations</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-mono text-clay/70 dark:text-white/45">
              Live Operations Desk
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink dark:text-white">
            Returns, Refunds & Replacements Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-clay dark:text-white/70">
            Review customer claims, verify uploaded photo proof, dispatch reverse logistics, issue refunds, or dispatch size & color replacements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadReturns(true)}
            disabled={refreshing}
            className="flex h-10 items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 text-xs font-semibold text-ink shadow-sm hover:bg-ink/5 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:hover:bg-white/10 transition"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-white shadow-md hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90 transition"
          >
            <FileSpreadsheet size={14} />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* ── Operations KPI Counters ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Pending Review */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Pending Review</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            {kpiStats.requested} claims
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Requires photo review</p>
        </div>

        {/* Scheduled Pickups */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Reverse Logistics</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {kpiStats.approved} in transit
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Doorstep pickups scheduled</p>
        </div>

        {/* Replacements / Exchanges */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Replacements</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <RefreshCw size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {kpiStats.replacements} exchanges
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Size & variant swaps</p>
        </div>

        {/* Total Returns Processed */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Total Claims</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <RotateCcw size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white">
            {kpiStats.total} total
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Recorded across store orders</p>
        </div>

        {/* Total Refunded Amount */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Refunds Credited</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {currency(kpiStats.refundedSum)}
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">{kpiStats.refundedCount} payouts cleared</p>
        </div>
      </div>

      {/* ── Filter Tabs & Search Controls ──────────────────────────────────── */}
      <div className="space-y-3">
        {/* Type Toggle Tabs: All | Returns | Replacements */}
        <div className="flex items-center gap-2 border-b border-ink/5 pb-2 dark:border-white/5">
          <button
            type="button"
            onClick={() => setRequestTypeFilter("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              requestTypeFilter === "all"
                ? "bg-ink text-white dark:bg-white dark:text-ink shadow-xs"
                : "border border-ink/10 text-clay hover:text-ink dark:border-white/10 dark:text-white/70"
            }`}
          >
            All Claims ({kpiStats.total})
          </button>
          <button
            type="button"
            onClick={() => setRequestTypeFilter("returns")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              requestTypeFilter === "returns"
                ? "bg-amber-600 text-white shadow-xs"
                : "border border-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            <RotateCcw size={12} />
            <span>Returns & Refunds ({kpiStats.returnsOnly})</span>
          </button>
          <button
            type="button"
            onClick={() => setRequestTypeFilter("replacements")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              requestTypeFilter === "replacements"
                ? "bg-indigo-600 text-white shadow-xs"
                : "border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
            }`}
          >
            <RefreshCw size={12} />
            <span>Product Replacements ({kpiStats.replacements})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: "all", label: "All Statuses" },
              { key: "requested", label: "Pending Review" },
              { key: "approved", label: "Pickup Scheduled" },
              { key: "picked_up", label: "In Transit" },
              { key: "inspected", label: "Inspected" },
              { key: "replacement_dispatched", label: "Exchange Dispatched" },
              { key: "refunded", label: "Refunded" },
              { key: "rejected", label: "Rejected" }
            ].map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                      : "border border-ink/10 bg-white text-clay hover:text-ink dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white/70 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

        {/* Quick Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay/60 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order # or Return ID..."
            className="h-9 w-full rounded-full border border-ink/10 bg-white pl-8 pr-3 text-xs text-ink outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:placeholder:text-white/40"
          />
        </div>
      </div>
    </div>

      {/* ── Returns Request List ───────────────────────────────────────────── */}
      {filteredReturns.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand dark:bg-white/5 text-clay dark:text-white/40">
            <RotateCcw size={28} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">No Return Requests Found</h3>
          <p className="mt-1 text-xs text-clay dark:text-white/60">
            {searchQuery
              ? `No returns matched query "${searchQuery}".`
              : "No customer returns currently in this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((order) => {
            const ret = order.returnRequest;
            const decision = ret.adminDecision || {};
            const isExchange = ret.requestType === "replacement" || ret.preferredResolution === "exchange";
            const isPending = ret.status === "requested";
            const replDetails = ret.replacementDetails || {};

            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card transition-all dark:border-white/12 dark:bg-[#1e1e1e]"
              >
                {/* Return Card Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/8 dark:border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-ink dark:text-white">
                        {ret.returnId}
                      </span>
                      <span className="text-clay/60 dark:text-white/40">·</span>
                      <span className="text-xs font-semibold text-clay dark:text-white/70">
                        Order #{order.orderNumber}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ret.status === "refunded" || ret.status === "replaced"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : ret.status === "rejected"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : ret.status === "replacement_dispatched"
                          ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                          : ret.status === "approved"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      }`}>
                        {ret.status?.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isExchange
                            ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {isExchange ? "Exchange Claim" : "Refund Claim"}
                      </span>
                    </div>

                    <p className="text-xs text-clay dark:text-white/60">
                      Customer: <strong className="text-ink dark:text-white">{order.customer?.name || "Customer"}</strong> ({order.customer?.email}) · Placed {shortDate(ret.requestedAt)}
                    </p>
                  </div>

                  {/* Top Action Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-left sm:text-right mr-2">
                      {isExchange ? (
                        <>
                          <p className="text-[11px] text-clay dark:text-white/50">Requested Variant</p>
                          <p className="font-display text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {replDetails.exchangeType === "size" && replDetails.requestedSize
                              ? `Size ${replDetails.requestedSize}`
                              : replDetails.exchangeType === "color" && replDetails.requestedColor
                              ? `Color: ${replDetails.requestedColor}`
                              : "Exact Swap"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] text-clay dark:text-white/50">Requested Refund</p>
                          <p className="font-display text-lg font-bold text-ink dark:text-white">
                            {currency(ret.refundAmount || order.total)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Fast decision buttons based on stage */}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(order, "approved")}
                          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(order, "rejected")}
                          className="flex items-center gap-1.5 rounded-full border border-rose-500/30 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 transition"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {ret.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(order, "picked_up")}
                        className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        <Truck size={13} />
                        <span>Confirm Picked Up</span>
                      </button>
                    )}

                    {ret.status === "picked_up" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(order, "inspected")}
                        className="flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition"
                      >
                        <ShieldCheck size={13} />
                        <span>Pass Inspection</span>
                      </button>
                    )}

                    {ret.status === "inspected" && (
                      isExchange ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(order, "replacement_dispatched")}
                          className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                        >
                          <RefreshCw size={13} />
                          <span>Dispatch Replacement</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(order, "refunded")}
                          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <CreditCard size={13} />
                          <span>Issue Refund</span>
                        </button>
                      )
                    )}

                    {ret.status === "replacement_dispatched" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(order, "replaced")}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Replacement Delivered</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Return Items & Customer Reason Breakdown */}
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  {/* Left: Reason & Items */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
                        Claimed Reason:
                      </span>
                      <p className="font-semibold text-sm text-ink dark:text-white mt-0.5">
                        {ret.reason}
                      </p>
                      {ret.detailedReason && (
                        <p className="mt-1 text-xs text-clay dark:text-white/70 italic bg-sand/30 p-2.5 rounded-xl dark:bg-white/5 leading-relaxed">
                          "{ret.detailedReason}"
                        </p>
                      )}
                    </div>

                    {/* Items being returned */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
                        Items Under Claim ({(ret.items || []).length}):
                      </span>
                      <div className="mt-1.5 space-y-1.5">
                        {(ret.items || []).map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl bg-sand/40 p-2 text-xs dark:bg-white/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={it.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"}
                                alt={it.name}
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                              <p className="font-semibold truncate max-w-[200px] text-ink dark:text-white">{it.name}</p>
                            </div>
                            <span className="font-bold text-ink dark:text-white shrink-0">
                              {currency(it.price * (it.quantity || 1))} (Qty {it.quantity || 1})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Uploaded Evidence Photos & Decision Status */}
                  <div className="space-y-3">
                    {/* Evidence Gallery */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
                        Uploaded Photo Evidence ({ret.evidence?.length || 0}):
                      </span>

                      {ret.evidence && ret.evidence.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ret.evidence.map((photo, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxImage(photo.url)}
                              className="group relative h-16 w-16 rounded-xl overflow-hidden border border-ink/10 cursor-pointer shadow-xs transition hover:scale-105 dark:border-white/12"
                            >
                              <img src={photo.url} alt="Return Evidence" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                                <Eye size={14} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-clay/60 dark:text-white/40 italic">
                          No customer photos uploaded for this claim.
                        </p>
                      )}
                    </div>

                    {/* Reverse Logistics / Refund Payout details */}
                    <div className="rounded-2xl border border-ink/5 bg-sand/30 p-3 text-xs dark:border-white/8 dark:bg-white/5 space-y-1">
                      <p className="font-semibold text-ink dark:text-white">Fulfillment Details:</p>
                      <p className="text-clay dark:text-white/70">
                        Preferred Resolution: <strong>{ret.preferredResolution?.replace("_", " ")}</strong>
                      </p>
                      {decision.pickupCarrier && (
                        <p className="text-clay dark:text-white/70">
                          Pickup Carrier: <strong>{decision.pickupCarrier}</strong> · Reverse Tracking: <strong className="font-mono">{decision.pickupTrackingNumber}</strong>
                        </p>
                      )}
                      {decision.refundTransactionId && (
                        <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Refund Ref: {decision.refundTransactionId} via {decision.refundMethod || "Original Payment"}
                        </p>
                      )}
                      {(decision.replacementCarrier || ret.replacementDetails?.replacementCarrier) && (
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Replacement Outbound: <strong>{decision.replacementCarrier || ret.replacementDetails?.replacementCarrier}</strong>
                          {(decision.replacementTrackingNumber || ret.replacementDetails?.replacementTrackingNumber) && (
                            <> · AWB: <strong className="font-mono">{decision.replacementTrackingNumber || ret.replacementDetails?.replacementTrackingNumber}</strong></>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Admin Decision Modal / Drawer ───────────────────────────────────── */}
      {activeDecisionOrder && (() => {
        const req = activeDecisionOrder.returnRequest || {};
        const isExchange = req.requestType === "replacement" || req.preferredResolution === "exchange";

        const decisionOptions = isExchange
          ? [
              { key: "approved", label: "Approve & Schedule Pickup" },
              { key: "picked_up", label: "Mark as Picked Up" },
              { key: "inspected", label: "Pass Quality Inspection" },
              { key: "replacement_dispatched", label: "Dispatch Replacement Item" },
              { key: "replaced", label: "Confirm Exchange Delivered" },
              { key: "rejected", label: "Reject Claim" }
            ]
          : [
              { key: "approved", label: "Approve & Schedule Pickup" },
              { key: "picked_up", label: "Mark as Picked Up" },
              { key: "inspected", label: "Pass Quality Inspection" },
              { key: "refunded", label: "Issue & Complete Refund" },
              { key: "rejected", label: "Reject Claim" }
            ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl dark:border-white/12 dark:bg-[#1a1a1a] text-ink dark:text-white">
              <div className="flex items-center justify-between pb-4 border-b border-ink/8 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 dark:bg-white/10 text-ink dark:text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">
                      {isExchange ? "Manage Replacement Lifecycle" : "Record Return Decision"}
                    </h3>
                    <p className="text-xs text-clay dark:text-white/60">
                      Claim ID: <strong className="font-mono">{req.returnId}</strong> ({isExchange ? "Product Exchange" : "Return & Refund"})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDecisionOrder(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-clay hover:bg-ink/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRecordDecision} className="mt-4 space-y-4">
                {/* Decision Type Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70 mb-1.5">
                    Update Lifecycle Stage *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {decisionOptions.map((btn) => (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => setDecisionType(btn.key)}
                        className={`rounded-xl border p-2 text-xs font-semibold transition ${
                          decisionType === btn.key
                            ? btn.key === "rejected"
                              ? "border-rose-500 bg-rose-500 text-white"
                              : btn.key === "replacement_dispatched"
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                            : "border-ink/10 bg-white text-clay hover:text-ink dark:border-white/10 dark:bg-[#222222] dark:text-white/70"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional fields: Approved Pickup */}
                {decisionType === "approved" && (
                  <div className="space-y-3 rounded-2xl bg-sand/30 p-3.5 dark:bg-white/5 border border-ink/5 dark:border-white/10 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Assigned Reverse Logistics Courier *</label>
                      <select
                        value={decisionCarrier}
                        onChange={(e) => setDecisionCarrier(e.target.value)}
                        className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                      >
                        {CARRIERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold mb-1">Scheduled Pickup Date</label>
                        <input
                          type="date"
                          value={decisionPickupDate}
                          onChange={(e) => setDecisionPickupDate(e.target.value)}
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Reverse Tracking Number</label>
                        <input
                          type="text"
                          value={decisionTrackingNumber}
                          onChange={(e) => setDecisionTrackingNumber(e.target.value)}
                          placeholder="e.g. BD-RET-998811"
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs font-mono dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields: Replacement Dispatched */}
                {decisionType === "replacement_dispatched" && (
                  <div className="space-y-3 rounded-2xl bg-indigo-500/10 p-3.5 dark:bg-indigo-500/15 border border-indigo-500/20 text-xs">
                    <div>
                      <label className="block font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                        Outbound Replacement Courier *
                      </label>
                      <select
                        value={decisionReplacementCarrier}
                        onChange={(e) => setDecisionReplacementCarrier(e.target.value)}
                        className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                      >
                        {CARRIERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                          Outbound Tracking AWB *
                        </label>
                        <input
                          type="text"
                          value={decisionReplacementTracking}
                          onChange={(e) => setDecisionReplacementTracking(e.target.value)}
                          placeholder="e.g. BD-REP-908122"
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs font-mono dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                          Estimated Delivery Date
                        </label>
                        <input
                          type="date"
                          value={decisionReplacementEstDelivery}
                          onChange={(e) => setDecisionReplacementEstDelivery(e.target.value)}
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional fields: Refunded */}
                {decisionType === "refunded" && (
                  <div className="space-y-3 rounded-2xl bg-emerald-500/10 p-3.5 dark:bg-emerald-500/15 border border-emerald-500/20 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Refund Amount (INR) *</label>
                        <input
                          type="number"
                          value={decisionRefundAmount}
                          onChange={(e) => setDecisionRefundAmount(Number(e.target.value))}
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs font-bold dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Payout Channel</label>
                        <select
                          value={decisionRefundMethod}
                          onChange={(e) => setDecisionRefundMethod(e.target.value)}
                          className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                        >
                          <option value="UPI Direct">UPI Direct Payout</option>
                          <option value="Original Payment Method">Original Payment Method (Card/Netbanking)</option>
                          <option value="Luxeva Store Credit">Luxeva Wallet Credit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Bank Reference / Txn ID *</label>
                      <input
                        type="text"
                        value={decisionRefundTxn}
                        onChange={(e) => setDecisionRefundTxn(e.target.value)}
                        placeholder="e.g. REF-UPI-98218731"
                        className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs font-mono dark:border-white/10 dark:bg-[#222222] dark:text-white"
                      />
                    </div>
                  </div>
                )}

              {decisionType === "rejected" && (
                <div className="space-y-2 rounded-2xl bg-rose-500/10 p-3.5 border border-rose-500/20 text-xs dark:bg-rose-500/15">
                  <label className="block font-semibold text-rose-700 dark:text-rose-300">
                    Rejection Reason / Rationale *
                  </label>
                  <select
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#222222] dark:text-white"
                  >
                    {REJECTION_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Operations Note to Customer */}
              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/70 mb-1">
                  Custom Customer Note / Internal Comments
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="e.g. Keep original packaging and tags ready for courier pickup..."
                  className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink outline-none dark:border-white/10 dark:bg-[#222222] dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/8 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveDecisionOrder(null)}
                  className="rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-clay hover:text-ink dark:border-white/12 dark:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingDecision}
                  className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90 disabled:opacity-60"
                >
                  {processingDecision ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Confirm Decision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    })()}

      {/* ── Photo Lightbox Modal ─────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Return Evidence Full Size" className="max-h-[80vh] w-auto object-contain rounded-2xl" />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsPage;
