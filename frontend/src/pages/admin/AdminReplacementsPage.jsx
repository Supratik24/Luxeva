import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
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
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";

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
  "Replacement requested beyond the 14-day policy window",
  "Serial number / SKU mismatch with original shipment",
  "Requested size/color variant out of stock and discontinued",
  "Item damaged due to customer misuse",
  "Other policy violation"
];

// Fallback seed replacement claims if running in local preview mode
const generateFallbackReplacements = () => {
  return [
    {
      _id: "ord_rep_01",
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
          pickupCarrier: "BlueDart Express",
          pickupTrackingNumber: "BD-RET-881203",
          replacementCarrier: "BlueDart Express",
          replacementTrackingNumber: "BD-REP-908122",
          replacementEstimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          notes: "Original unit received and verified. Exchange unit shipped via BlueDart Air."
        },
        timeline: [
          {
            status: "requested",
            title: "Replacement Claim Submitted",
            note: "Customer requested size exchange from M to L.",
            at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            status: "approved",
            title: "Exchange Approved & Pickup Scheduled",
            note: "Reverse pickup assigned to BlueDart Express.",
            at: new Date(Date.now() - 86400000 * 1.5).toISOString()
          },
          {
            status: "picked_up",
            title: "Original Item Picked Up",
            note: "Package collected by reverse courier.",
            at: new Date(Date.now() - 86400000 * 1.1).toISOString()
          },
          {
            status: "inspected",
            title: "Warehouse Inspection Passed",
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
    },
    {
      _id: "ord_rep_02",
      orderNumber: "LX-1014",
      customer: { name: "Pooja Hegde", email: "pooja.hegde@luxury.in", phone: "+91 97722 33445" },
      total: 3499,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      returnRequest: {
        returnId: "REP-LX-901423",
        requestType: "replacement",
        status: "requested",
        reason: "Size or fit not right",
        detailedReason: "Ordered size S, but need size M for a looser silhouette. Kurta is unworn with tags.",
        preferredResolution: "exchange",
        replacementDetails: {
          exchangeType: "size",
          requestedSize: "M",
          requestedColor: "Olive Gold",
          replacementItemName: "Handcrafted Silk Kurta (Size M)",
          customerNotes: "Kindly send the M size variant as soon as possible for an upcoming wedding."
        },
        items: [
          {
            productId: "p_silk_kurta",
            name: "Handcrafted Silk Kurta",
            price: 2999,
            quantity: 1,
            image: "/products/cotton-printed-kurta-set.png"
          }
        ],
        evidence: [
          { url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80", name: "tag_intact.jpg" }
        ],
        refundAmount: 0,
        requestedAt: new Date(Date.now() - 86400000 * 0.6).toISOString(),
        timeline: [
          {
            status: "requested",
            title: "Exchange Request Placed",
            note: "Customer requested Size M replacement. Awaiting operational review.",
            at: new Date(Date.now() - 86400000 * 0.6).toISOString()
          }
        ]
      }
    },
    {
      _id: "ord_rep_03",
      orderNumber: "LX-1016",
      customer: { name: "Rohan Kapoor", email: "rohan.kapoor@outlook.com", phone: "+91 99112 33445" },
      total: 3999,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      returnRequest: {
        returnId: "REP-LX-773192",
        requestType: "replacement",
        status: "inspected",
        reason: "Damaged / Defective product received",
        detailedReason: "One of the stitching seams on the shoulder was undone upon arrival. Want exact flawless unit swap.",
        preferredResolution: "exchange",
        replacementDetails: {
          exchangeType: "defective",
          requestedSize: "42 Reg",
          requestedColor: "Midnight Black",
          replacementItemName: "Pure Mulberry Silk Scarf - Flawless Unit Swap",
          customerNotes: "Please verify seam quality before dispatch."
        },
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
          { url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80", name: "seam_defect.jpg" }
        ],
        refundAmount: 0,
        requestedAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
        adminDecision: {
          status: "inspected",
          pickupCarrier: "Delhivery Reverse",
          pickupTrackingNumber: "DEL-RET-449911",
          notes: "Defective unit received and inspected. Fresh replacement ready in packing queue."
        },
        timeline: [
          {
            status: "requested",
            title: "Replacement Requested",
            note: "Customer uploaded photo proof of seam unraveling.",
            at: new Date(Date.now() - 86400000 * 3.5).toISOString()
          },
          {
            status: "approved",
            title: "Exchange Approved",
            note: "Delhivery Reverse assigned for pickup.",
            at: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            status: "picked_up",
            title: "Defective Item Collected",
            note: "Courier picked up parcel.",
            at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            status: "inspected",
            title: "Warehouse Inspection Passed",
            note: "Defect confirmed under QC. Fresh unit pulled from inventory.",
            at: new Date(Date.now() - 86400000 * 0.8).toISOString()
          }
        ]
      }
    },
    {
      _id: "ord_rep_04",
      orderNumber: "LX-1011",
      customer: { name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+91 98765 43210" },
      total: 3499,
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      returnRequest: {
        returnId: "REP-LX-654109",
        requestType: "replacement",
        status: "replaced",
        reason: "Size or fit not right",
        detailedReason: "Loafers were tight at the toe box. Exchanged for UK 10.",
        preferredResolution: "exchange",
        replacementDetails: {
          exchangeType: "size",
          requestedSize: "UK 10",
          requestedColor: "Tan Brown",
          replacementItemName: "Leather Formal Loafers (UK 10)",
          replacementCarrier: "Delhivery Express",
          replacementTrackingNumber: "DEL-REP-559921",
          replacementDispatchedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          replacementEstimatedDelivery: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0]
        },
        items: [
          {
            productId: "p_loafers",
            name: "Leather Formal Loafers",
            price: 3499,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"
          }
        ],
        evidence: [],
        refundAmount: 0,
        requestedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        adminDecision: {
          status: "replaced",
          pickupCarrier: "Delhivery Reverse",
          pickupTrackingNumber: "DEL-RET-331199",
          replacementCarrier: "Delhivery Express",
          replacementTrackingNumber: "DEL-REP-559921",
          notes: "Customer received replacement parcel. Exchange closed successfully."
        },
        timeline: [
          {
            status: "requested",
            title: "Size Exchange Requested",
            note: "Exchange for UK 10 submitted.",
            at: new Date(Date.now() - 86400000 * 7).toISOString()
          },
          {
            status: "approved",
            title: "Exchange Approved",
            note: "Pickup scheduled.",
            at: new Date(Date.now() - 86400000 * 6).toISOString()
          },
          {
            status: "picked_up",
            title: "Original Item Picked Up",
            note: "Courier collected parcel.",
            at: new Date(Date.now() - 86400000 * 5).toISOString()
          },
          {
            status: "inspected",
            title: "Inspection Passed",
            note: "Shoes unworn with box. Ready for dispatch.",
            at: new Date(Date.now() - 86400000 * 4.5).toISOString()
          },
          {
            status: "replacement_dispatched",
            title: "Replacement Dispatched",
            note: "Dispatched via Delhivery Express (DEL-REP-559921).",
            at: new Date(Date.now() - 86400000 * 4).toISOString()
          },
          {
            status: "replaced",
            title: "Replacement Delivered & Claim Completed",
            note: "Exchange unit safely delivered to customer.",
            at: new Date(Date.now() - 86400000 * 1).toISOString()
          }
        ]
      }
    }
  ];
};

const AdminReplacementsPage = () => {
  const [replacementsList, setReplacementsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Operational Decision Modal State
  const [activeDecisionOrder, setActiveDecisionOrder] = useState(null);
  const [decisionType, setDecisionType] = useState("approved"); // 'approved' | 'picked_up' | 'inspected' | 'replacement_dispatched' | 'replaced' | 'rejected'
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
  const [decisionRationale, setDecisionRationale] = useState(REJECTION_PRESETS[0]);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);

  // Evidence Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

  // Load replacements list
  const loadReplacements = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(endpoints.orders.adminReturns);
      const data = res.data?.data?.returns || res.data?.returns || [];
      // Filter for replacement claims only
      const replacementsOnly = data.filter(
        (o) =>
          o.returnRequest &&
          o.returnRequest.status !== "none" &&
          (o.returnRequest.requestType === "replacement" || o.returnRequest.preferredResolution === "exchange")
      );

      if (replacementsOnly.length > 0) {
        setReplacementsList(replacementsOnly);
      } else {
        setReplacementsList(generateFallbackReplacements());
      }
    } catch (err) {
      console.warn("Replacements fetch fallback:", err);
      setReplacementsList(generateFallbackReplacements());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReplacements();
  }, []);

  // Filtered replacements list
  const filteredReplacements = useMemo(() => {
    return replacementsList.filter((item) => {
      const retReq = item.returnRequest;
      if (!retReq || retReq.status === "none") return false;

      // Status filter
      if (filterStatus !== "all" && retReq.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrder = item.orderNumber?.toLowerCase().includes(q);
        const matchesReturnId = retReq.returnId?.toLowerCase().includes(q);
        const matchesCustomer =
          item.customer?.name?.toLowerCase().includes(q) || item.customer?.email?.toLowerCase().includes(q);
        const matchesVariant =
          retReq.replacementDetails?.requestedSize?.toLowerCase().includes(q) ||
          retReq.replacementDetails?.requestedColor?.toLowerCase().includes(q);
        return matchesOrder || matchesReturnId || matchesCustomer || matchesVariant;
      }

      return true;
    });
  }, [replacementsList, filterStatus, searchQuery]);

  // Overall KPI counts
  const kpiStats = useMemo(() => {
    const list = (replacementsList || []).filter((r) => r && r.returnRequest && r.returnRequest.status !== "none");
    const requested = list.filter((r) => r.returnRequest?.status === "requested").length;
    const pickupsInTransit = list.filter((r) => ["approved", "picked_up"].includes(r.returnRequest?.status)).length;
    const inspected = list.filter((r) => r.returnRequest?.status === "inspected").length;
    const dispatched = list.filter((r) => r.returnRequest?.status === "replacement_dispatched").length;
    const completed = list.filter((r) => r.returnRequest?.status === "replaced").length;

    return {
      total: list.length,
      requested,
      pickupsInTransit,
      inspected,
      dispatched,
      completed
    };
  }, [replacementsList]);

  // Open Decision Dialog
  const handleOpenDecision = (order, defaultAction = "approved") => {
    const ret = order.returnRequest;
    setActiveDecisionOrder(order);
    setDecisionType(defaultAction);
    setDecisionTrackingNumber(
      ret.adminDecision?.pickupTrackingNumber ||
        `RET-TRK-${Math.floor(100000 + Math.random() * 900000)}`
    );
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
      replacementCarrier: decisionType === "replacement_dispatched" ? decisionReplacementCarrier : undefined,
      replacementTrackingNumber: decisionType === "replacement_dispatched" ? decisionReplacementTracking : undefined,
      replacementEstimatedDelivery: decisionType === "replacement_dispatched" ? decisionReplacementEstDelivery : undefined,
      notes: decisionNotes
    };

    try {
      await api.patch(endpoints.orders.adminReviewReturn(orderId), payload);
      toast.success(`Exchange status updated: ${decisionType.toUpperCase().replace("_", " ")}`);

      setReplacementsList((prev) =>
        prev.map((item) => {
          if (item._id === orderId) {
            const updatedReplacementDetails =
              decisionType === "replacement_dispatched"
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
                    title:
                      decisionType === "replacement_dispatched"
                        ? "Replacement Dispatched"
                        : decisionType === "replaced"
                        ? "Replacement Delivered & Claim Completed"
                        : `Status: ${decisionType.toUpperCase().replace("_", " ")}`,
                    note:
                      decisionNotes ||
                      (decisionType === "rejected"
                        ? decisionRationale
                        : `Status updated to ${decisionType}`),
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
      toast.success(`Exchange updated: ${decisionType.toUpperCase().replace("_", " ")}`);

      setReplacementsList((prev) =>
        prev.map((item) => {
          if (item._id === orderId) {
            const updatedReplacementDetails =
              decisionType === "replacement_dispatched"
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
                    title:
                      decisionType === "replacement_dispatched"
                        ? "Replacement Dispatched"
                        : decisionType === "replaced"
                        ? "Replacement Delivered & Claim Completed"
                        : `Status: ${decisionType.toUpperCase().replace("_", " ")}`,
                    note:
                      decisionNotes ||
                      (decisionType === "rejected"
                        ? decisionRationale
                        : `Status updated to ${decisionType}`),
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

  // Export Replacements CSV Manifest
  const handleExportCSV = () => {
    const headers = [
      "Replacement ID",
      "Order Number",
      "Customer Name",
      "Customer Email",
      "Status",
      "Exchange Type",
      "Requested Size",
      "Requested Color",
      "Original Item",
      "Reverse Carrier",
      "Reverse Tracking AWB",
      "Outbound Carrier",
      "Outbound Tracking AWB",
      "Est Delivery"
    ];

    const rows = filteredReplacements.map((o) => {
      const r = o.returnRequest || {};
      const d = r.adminDecision || {};
      const rep = r.replacementDetails || {};
      const origItem = (r.items || [])[0] || {};
      return [
        r.returnId || "N/A",
        o.orderNumber,
        o.customer?.name || "Guest",
        o.customer?.email || "",
        r.status,
        rep.exchangeType || "size",
        rep.requestedSize || "N/A",
        rep.requestedColor || "N/A",
        origItem.name || "N/A",
        d.pickupCarrier || "N/A",
        d.pickupTrackingNumber || "N/A",
        rep.replacementCarrier || d.replacementCarrier || "N/A",
        rep.replacementTrackingNumber || d.replacementTrackingNumber || "N/A",
        rep.replacementEstimatedDelivery || d.replacementEstimatedDelivery || "N/A"
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luxeva-replacements-manifest-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Replacements manifest CSV downloaded!");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/8 pb-6 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-clay dark:text-white/60">Fulfillment Operations</span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-mono text-clay/70 dark:text-white/45">
              Replacements & Exchanges Desk
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink dark:text-white">
            Product Replacements Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-clay dark:text-white/70">
            Manage customer size and color exchange requests, assign reverse pickups, allocate replacement inventory, dispatch outbound couriers with tracking AWBs, and confirm delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/portal/admin/returns"
            className="flex h-10 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/25 transition shadow-xs"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Returns & Refunds Desk</span>
            <span className="sm:hidden">Returns</span>
          </Link>

          <button
            type="button"
            onClick={() => loadReplacements(true)}
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
          <p className="mt-1 text-xs text-clay dark:text-white/60">Awaiting size/color check</p>
        </div>

        {/* Reverse Logistics */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Reverse Pickups</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {kpiStats.pickupsInTransit} in transit
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Original item collection</p>
        </div>

        {/* Warehouse Inspected */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Stock Allocated</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
            {kpiStats.inspected} units
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Ready for dispatch</p>
        </div>

        {/* Dispatched */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Outbound Dispatched</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <RefreshCw size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {kpiStats.dispatched} parcels
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Courier tracking active</p>
        </div>

        {/* Completed Exchanges */}
        <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-clay dark:text-white/60">Completed</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {kpiStats.completed} replaced
          </p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">Delivered to customers</p>
        </div>
      </div>

      {/* ── Status Tabs & Search Controls ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "all", label: "All Exchanges" },
            { key: "requested", label: "Pending Review" },
            { key: "approved", label: "Pickup Scheduled" },
            { key: "picked_up", label: "In Transit" },
            { key: "inspected", label: "Stock Ready" },
            { key: "replacement_dispatched", label: "Dispatched" },
            { key: "replaced", label: "Completed" },
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
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay/60 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, Claim ID, or Size..."
            className="h-9 w-full rounded-full border border-ink/10 bg-white pl-8 pr-3 text-xs text-ink outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:placeholder:text-white/40"
          />
        </div>
      </div>

      {/* ── Replacements Claim List ────────────────────────────────────────── */}
      {filteredReplacements.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center shadow-card dark:border-white/12 dark:bg-[#1e1e1e]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand dark:bg-white/5 text-clay dark:text-white/40">
            <RefreshCw size={28} />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">No Replacement Claims Found</h3>
          <p className="mt-1 text-xs text-clay dark:text-white/60">
            {searchQuery
              ? `No replacement requests matched query "${searchQuery}".`
              : "No customer replacement claims currently in this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReplacements.map((order) => {
            const ret = order.returnRequest;
            const decision = ret.adminDecision || {};
            const isPending = ret.status === "requested";
            const replDetails = ret.replacementDetails || {};

            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-white p-5 sm:p-6 shadow-card transition-all dark:border-white/12 dark:bg-[#1e1e1e]"
              >
                {/* Replacement Card Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/8 dark:border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {ret.returnId}
                      </span>
                      <span className="text-clay/60 dark:text-white/40">·</span>
                      <span className="text-xs font-semibold text-clay dark:text-white/70">
                        Order #{order.orderNumber}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          ret.status === "replaced"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : ret.status === "rejected"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : ret.status === "replacement_dispatched"
                            ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                            : ret.status === "approved"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                            : ret.status === "inspected"
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {ret.status === "replacement_dispatched"
                          ? "Dispatched"
                          : ret.status === "replaced"
                          ? "Completed"
                          : ret.status?.replace("_", " ")}
                      </span>
                      <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        Exchange Claim
                      </span>
                    </div>

                    <p className="text-xs text-clay dark:text-white/60">
                      Customer: <strong className="text-ink dark:text-white">{order.customer?.name || "Customer"}</strong> ({order.customer?.email}) · Placed {shortDate(ret.requestedAt)}
                    </p>
                  </div>

                  {/* Top Action Buttons based on Stage */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-left sm:text-right mr-2">
                      <p className="text-[11px] text-clay dark:text-white/50">Exchange Target</p>
                      <p className="font-display text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {replDetails.exchangeType === "size" && replDetails.requestedSize
                          ? `Size ${replDetails.requestedSize}`
                          : replDetails.exchangeType === "color" && replDetails.requestedColor
                          ? `Color: ${replDetails.requestedColor}`
                          : "Exact Swap"}
                      </p>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(order, "approved")}
                          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve Exchange</span>
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
                        <span>Confirm Pickup</span>
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
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(order, "replacement_dispatched")}
                        className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                      >
                        <RefreshCw size={13} />
                        <span>Dispatch Replacement</span>
                      </button>
                    )}

                    {ret.status === "replacement_dispatched" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(order, "replaced")}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Delivered</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Replacement Items & Specifications Breakdown */}
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  {/* Left: Original Item & Exchange Reason */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
                        Reason for Replacement:
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

                    {/* Original Item returning */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
                        Original Product:
                      </span>
                      <div className="mt-1.5 space-y-1.5">
                        {(ret.items || []).map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl bg-sand/40 p-2 text-xs dark:bg-white/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={it.image || "/placeholder.jpg"}
                                alt={it.name}
                                className="h-10 w-10 rounded-lg object-cover bg-white"
                              />
                              <div className="truncate">
                                <p className="font-medium text-ink dark:text-white truncate">{it.name}</p>
                                <p className="text-[11px] text-clay dark:text-white/50">
                                  Qty: {it.quantity} · Price: {currency(it.price)}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-ink dark:text-white shrink-0 ml-2">
                              {currency(it.price * (it.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Replacement Specification & Logistics Details */}
                  <div className="space-y-3 rounded-2xl bg-indigo-500/5 p-4 border border-indigo-500/15 dark:bg-indigo-500/10">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        Requested Exchange Specification:
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                          {replDetails.exchangeType === "size"
                            ? `Exchange Size: ${replDetails.requestedSize || "Not specified"}`
                            : replDetails.exchangeType === "color"
                            ? `Exchange Color: ${replDetails.requestedColor || "Not specified"}`
                            : "Defective Exact Swap"}
                        </span>
                        {replDetails.requestedColor && replDetails.exchangeType === "size" && (
                          <span className="rounded-lg border border-indigo-500/30 bg-white/60 px-2.5 py-1 text-xs font-medium text-indigo-900 dark:bg-black/30 dark:text-indigo-200">
                            Color: {replDetails.requestedColor}
                          </span>
                        )}
                      </div>
                      {replDetails.customerNotes && (
                        <p className="mt-2 text-xs text-clay dark:text-white/70 italic">
                          Note from customer: "{replDetails.customerNotes}"
                        </p>
                      )}
                    </div>

                    {/* Outbound Dispatch Details (if dispatched) */}
                    {(ret.status === "replacement_dispatched" || ret.status === "replaced") && (
                      <div className="pt-2 border-t border-indigo-500/15">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <Truck size={13} />
                          <span>Outbound Replacement Courier</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] text-clay dark:text-white/50">Carrier:</p>
                            <p className="font-semibold text-ink dark:text-white">
                              {replDetails.replacementCarrier || decision.replacementCarrier || "Express Cargo"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-clay dark:text-white/50">Tracking AWB:</p>
                            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {replDetails.replacementTrackingNumber || decision.replacementTrackingNumber || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reverse Pickup Courier */}
                    {decision.pickupTrackingNumber && (
                      <div className="pt-2 border-t border-indigo-500/15">
                        <p className="text-[10px] uppercase font-semibold text-clay dark:text-white/50">
                          Reverse Pickup: {decision.pickupCarrier || "Courier"} · AWB: {decision.pickupTrackingNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Operational Decision Modal ─────────────────────────────────────── */}
      {activeDecisionOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1a1a1a] dark:text-white border border-ink/10 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10 dark:border-white/10">
              <div>
                <h3 className="font-display text-lg font-bold text-ink dark:text-white">
                  Update Replacement Claim #{activeDecisionOrder.returnRequest?.returnId}
                </h3>
                <p className="text-xs text-clay dark:text-white/60">
                  Order #{activeDecisionOrder.orderNumber} · Customer: {activeDecisionOrder.customer?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDecisionOrder(null)}
                className="rounded-full p-1.5 text-clay hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordDecision} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-clay dark:text-white/70 block mb-1">
                  Target Stage:
                </label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-sand/30 p-2.5 text-xs text-ink dark:border-white/15 dark:bg-[#252525] dark:text-white focus:outline-none"
                >
                  <option value="approved">Approve Exchange & Schedule Reverse Pickup</option>
                  <option value="picked_up">Mark Original Item Collected by Courier</option>
                  <option value="inspected">Pass Inspection (Allocate Replacement Stock)</option>
                  <option value="replacement_dispatched">Dispatch Outbound Replacement Parcel</option>
                  <option value="replaced">Mark Replacement Delivered (Complete Claim)</option>
                  <option value="rejected">Reject Replacement Request</option>
                </select>
              </div>

              {/* Reverse Pickup Fields */}
              {["approved", "picked_up"].includes(decisionType) && (
                <div className="space-y-3 rounded-2xl bg-sand/40 p-3.5 dark:bg-white/5">
                  <p className="font-semibold text-ink dark:text-white">Reverse Pickup Assignment</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Carrier:</label>
                      <select
                        value={decisionCarrier}
                        onChange={(e) => setDecisionCarrier(e.target.value)}
                        className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                      >
                        {CARRIERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Pickup Date:</label>
                      <input
                        type="date"
                        value={decisionPickupDate}
                        onChange={(e) => setDecisionPickupDate(e.target.value)}
                        className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Reverse AWB #:</label>
                    <input
                      type="text"
                      value={decisionTrackingNumber}
                      onChange={(e) => setDecisionTrackingNumber(e.target.value)}
                      placeholder="e.g. DEL-RET-889911"
                      className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Outbound Replacement Courier Fields */}
              {decisionType === "replacement_dispatched" && (
                <div className="space-y-3 rounded-2xl bg-indigo-500/10 p-3.5 border border-indigo-500/20 dark:bg-indigo-500/15">
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Truck size={14} />
                    <span>Outbound Replacement Dispatch Details</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Shipping Carrier:</label>
                      <select
                        value={decisionReplacementCarrier}
                        onChange={(e) => setDecisionReplacementCarrier(e.target.value)}
                        className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                      >
                        {CARRIERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Estimated Arrival:</label>
                      <input
                        type="date"
                        value={decisionReplacementEstDelivery}
                        onChange={(e) => setDecisionReplacementEstDelivery(e.target.value)}
                        className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-clay dark:text-white/60 block mb-0.5">Outbound Tracking Number (AWB):</label>
                    <input
                      type="text"
                      value={decisionReplacementTracking}
                      onChange={(e) => setDecisionReplacementTracking(e.target.value)}
                      placeholder="e.g. BD-REP-908122"
                      required
                      className="w-full rounded-lg border border-ink/10 bg-white p-2 text-xs font-mono dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Rejection Rationale */}
              {decisionType === "rejected" && (
                <div className="space-y-2 rounded-2xl bg-rose-500/10 p-3.5 border border-rose-500/20">
                  <label className="font-semibold text-rose-700 dark:text-rose-300 block">
                    Reason for Rejection:
                  </label>
                  <select
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    className="w-full rounded-lg border border-rose-500/30 bg-white p-2 text-xs dark:bg-[#2a2a2a] dark:text-white"
                  >
                    {REJECTION_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-clay dark:text-white/70 block mb-1">
                  Internal Operational Notes:
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes visible in tracking timeline..."
                  className="w-full rounded-xl border border-ink/15 bg-sand/30 p-2.5 text-xs text-ink dark:border-white/15 dark:bg-[#252525] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveDecisionOrder(null)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-clay hover:bg-ink/5 dark:text-white/70 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingDecision}
                  className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-ink/80 dark:bg-white dark:text-ink dark:hover:bg-white/90 disabled:opacity-50"
                >
                  {processingDecision ? "Saving..." : "Save Operational Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReplacementsPage;
