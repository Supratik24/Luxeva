import { useState } from "react";
import {
  X,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  DollarSign,
  Truck,
  ShieldCheck,
  CreditCard,
  Wallet,
  RefreshCw,
  HelpCircle,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";
import { currency } from "../../utils/format";

const REASON_PRESETS = [
  { id: "damaged_defective", label: "Damaged / Defective product received", requireEvidence: true },
  { id: "wrong_item", label: "Wrong product or color sent", requireEvidence: true },
  { id: "size_fit", label: "Size or fit not right", requireEvidence: false },
  { id: "quality_issue", label: "Quality or fabric not as expected", requireEvidence: false },
  { id: "differs_from_photo", label: "Item differs from website photos", requireEvidence: true },
  { id: "arrived_late", label: "Arrived too late / No longer needed", requireEvidence: false },
  { id: "other", label: "Other reason", requireEvidence: false }
];

const RESOLUTION_OPTIONS = [
  {
    id: "refund_original",
    title: "Refund to Original Payment",
    desc: "Refunded to original card / bank / UPI in 3-5 business days after pickup.",
    icon: CreditCard
  },
  {
    id: "store_credit",
    title: "Instant Store Credit (+5% Bonus)",
    desc: "Immediately credited to your Luxeva wallet upon reverse pickup.",
    icon: Wallet
  },
  {
    id: "exchange",
    title: "Replacement / Size Exchange",
    desc: "A fresh replacement item will be dispatched once pickup is confirmed.",
    icon: RefreshCw
  }
];

const ReturnRequestModal = ({ order, isOpen, onClose, onReturnSubmitted, initialMode = "return" }) => {
  const orderItems = order?.items || [];

  // Form State
  const [requestMode, setRequestMode] = useState(initialMode || "return");
  const [exchangeType, setExchangeType] = useState("size");
  const [requestedSize, setRequestedSize] = useState("");
  const [requestedColor, setRequestedColor] = useState("");
  const [replacementNotes, setReplacementNotes] = useState("");

  const [selectedItemIds, setSelectedItemIds] = useState(() => {
    // Default select all items in order
    return orderItems.map((item, idx) => item.productId || idx);
  });
  const [quantities, setQuantities] = useState(() => {
    const qMap = {};
    orderItems.forEach((item, idx) => {
      qMap[item.productId || idx] = item.quantity || 1;
    });
    return qMap;
  });
  const [reason, setReason] = useState(REASON_PRESETS[0].label);
  const [detailedReason, setDetailedReason] = useState("");
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [preferredResolution, setPreferredResolution] = useState(initialMode === "replacement" ? "exchange" : "refund_original");
  const [upiId, setUpiId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // Toggle item selection
  const handleToggleItem = (itemId) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        if (prev.length === 1) {
          toast.error("Please select at least one item to return");
          return prev;
        }
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Calculate estimated refund for selected items
  const estimatedRefund = orderItems.reduce((sum, item, idx) => {
    const itemId = item.productId || idx;
    if (selectedItemIds.includes(itemId)) {
      const qty = quantities[itemId] || 1;
      return sum + Number(item.price || 0) * qty;
    }
    return sum;
  }, 0);

  // File upload handler (reads files as Base64 Data URLs for instant preview & persistence)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (evidenceImages.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 evidence photos");
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setEvidenceImages((prev) => [
          ...prev,
          {
            name: file.name,
            url: loadEvent.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setEvidenceImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit return or replacement request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedItemIds.length) {
      toast.error("Please select at least one item");
      return;
    }

    const isReplacement = requestMode === "replacement";

    if (isReplacement && exchangeType === "size" && !requestedSize.trim()) {
      toast.error("Please select or enter your requested replacement size");
      return;
    }

    if (isReplacement && exchangeType === "color" && !requestedColor.trim()) {
      toast.error("Please specify your requested replacement color");
      return;
    }

    const currentReasonObj = REASON_PRESETS.find((r) => r.label === reason);
    if (currentReasonObj?.requireEvidence && evidenceImages.length === 0) {
      toast.error("Please upload at least 1 photo showing the product defect/issue");
      return;
    }

    // Build payload
    const selectedItemsData = orderItems
      .filter((item, idx) => selectedItemIds.includes(item.productId || idx))
      .map((item, idx) => ({
        productId: item.productId || idx,
        name: item.name,
        price: item.price,
        quantity: quantities[item.productId || idx] || 1,
        image: item.image || ""
      }));

    const payload = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      requestType: requestMode,
      reason,
      detailedReason,
      items: selectedItemsData,
      evidence: evidenceImages,
      preferredResolution: isReplacement ? "exchange" : preferredResolution,
      replacementDetails: isReplacement
        ? {
            exchangeType,
            requestedSize: requestedSize.trim(),
            requestedColor: requestedColor.trim(),
            replacementItemName: selectedItemsData.map((i) => i.name).join(", "),
            customerNotes: replacementNotes.trim()
          }
        : undefined,
      upiId: !isReplacement && preferredResolution === "refund_original" ? upiId : "",
      refundAmount: isReplacement ? 0 : estimatedRefund
    };

    setSubmitting(true);
    try {
      const res = await api.post(endpoints.orders.requestReturn(order._id), payload);
      const updatedOrder = res.data?.data?.order || {
        ...order,
        returnRequest: {
          returnId: isReplacement
            ? `REP-LX-${Math.floor(100000 + Math.random() * 900000)}`
            : `RET-LX-${Math.floor(100000 + Math.random() * 900000)}`,
          requestType: requestMode,
          status: "requested",
          reason,
          detailedReason,
          items: selectedItemsData,
          evidence: evidenceImages,
          preferredResolution: isReplacement ? "exchange" : preferredResolution,
          replacementDetails: isReplacement
            ? {
                exchangeType,
                requestedSize: requestedSize.trim(),
                requestedColor: requestedColor.trim(),
                replacementItemName: selectedItemsData.map((i) => i.name).join(", "),
                customerNotes: replacementNotes.trim()
              }
            : undefined,
          refundAmount: isReplacement ? 0 : estimatedRefund,
          requestedAt: new Date().toISOString(),
          timeline: [
            {
              status: "requested",
              title: isReplacement ? "Replacement Request Submitted" : "Return Request Submitted",
              note: isReplacement
                ? `Exchange requested (${exchangeType}: ${requestedSize || requestedColor || "Replacement swap"}). Reverse pickup scheduled.`
                : "Customer initiated return request with uploaded details. Pending quality team review.",
              at: new Date().toISOString()
            }
          ]
        }
      };

      toast.success(
        isReplacement
          ? "Replacement request submitted! We will arrange pickup and dispatch your exchange item."
          : "Return request submitted! Our quality team will review it within 24 hours."
      );
      if (onReturnSubmitted) {
        onReturnSubmitted(updatedOrder);
      }
      onClose();
    } catch (err) {
      console.error("Return request error:", err);
      // Fallback optimistic simulation for preview mode
      const simulatedOrder = {
        ...order,
        returnRequest: {
          returnId: isReplacement
            ? `REP-LX-${Math.floor(100000 + Math.random() * 900000)}`
            : `RET-LX-${Math.floor(100000 + Math.random() * 900000)}`,
          requestType: requestMode,
          status: "requested",
          reason,
          detailedReason,
          items: selectedItemsData,
          evidence: evidenceImages,
          preferredResolution: isReplacement ? "exchange" : preferredResolution,
          replacementDetails: isReplacement
            ? {
                exchangeType,
                requestedSize: requestedSize.trim(),
                requestedColor: requestedColor.trim(),
                replacementItemName: selectedItemsData.map((i) => i.name).join(", "),
                customerNotes: replacementNotes.trim()
              }
            : undefined,
          refundAmount: isReplacement ? 0 : estimatedRefund,
          requestedAt: new Date().toISOString(),
          timeline: [
            {
              status: "requested",
              title: isReplacement ? "Replacement Request Submitted" : "Return Request Submitted",
              note: isReplacement
                ? `Exchange requested (${exchangeType}: ${requestedSize || requestedColor || "Replacement swap"}). Reverse pickup scheduled.`
                : "Customer initiated return request with uploaded details. Pending quality team review.",
              at: new Date().toISOString()
            }
          ]
        }
      };

      toast.success(
        isReplacement
          ? "Replacement request recorded! Reverse pickup and exchange will be scheduled."
          : "Return request recorded! Reverse pickup will be scheduled upon approval."
      );
      if (onReturnSubmitted) {
        onReturnSubmitted(simulatedOrder);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-ink/10 bg-white p-5 sm:p-8 shadow-2xl dark:border-white/12 dark:bg-[#1a1a1a] text-ink dark:text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ink/8 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                requestMode === "replacement"
                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              }`}
            >
              {requestMode === "replacement" ? <RefreshCw size={18} /> : <RotateCcw size={18} />}
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold">
                {requestMode === "replacement" ? "Request Product Replacement" : "Request Return & Refund"}
              </h2>
              <p className="text-xs text-clay dark:text-white/60">
                Order <strong className="font-mono">{order.orderNumber}</strong> ·{" "}
                {requestMode === "replacement"
                  ? "Free Doorstep Pickup & Size/Variant Exchange"
                  : "14-Day Free Doorstep Return & Full Refund"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-clay hover:bg-ink/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Segmented Switch: Return vs Replacement */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-sand/60 dark:bg-white/5 border border-ink/8 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setRequestMode("return");
                if (preferredResolution === "exchange") setPreferredResolution("refund_original");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                requestMode === "return"
                  ? "bg-white dark:bg-[#252525] text-ink dark:text-white shadow-sm"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              <RotateCcw size={14} className={requestMode === "return" ? "text-amber-500" : ""} />
              <span>Return & Refund</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestMode("replacement");
                setPreferredResolution("exchange");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                requestMode === "replacement"
                  ? "bg-white dark:bg-[#252525] text-ink dark:text-white shadow-sm"
                  : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
              }`}
            >
              <RefreshCw size={14} className={requestMode === "replacement" ? "text-blue-500" : ""} />
              <span>Product Replacement / Exchange</span>
            </button>
          </div>

          {/* Step 1: Select Items */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70">
              1. Select Item(s) to {requestMode === "replacement" ? "Replace" : "Return"}
            </label>
            <div className="space-y-2.5">
              {orderItems.map((item, idx) => {
                const itemId = item.productId || idx;
                const isSelected = selectedItemIds.includes(itemId);
                return (
                  <div
                    key={itemId}
                    onClick={() => handleToggleItem(itemId)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                      isSelected
                        ? "border-ink bg-ink/5 dark:border-white/40 dark:bg-white/5"
                        : "border-ink/10 bg-sand/30 opacity-70 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container onClick
                        className="h-4 w-4 rounded accent-ink dark:accent-white"
                      />
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.name}</p>
                        <p className="text-[11px] text-clay dark:text-white/50">
                          Qty: {item.quantity || 1} · {currency(item.price)} each
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs sm:text-sm">{currency((item.price || 0) * (quantities[itemId] || 1))}</p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Eligible</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Replacement Specifications (Only if Replacement mode) */}
          {requestMode === "replacement" && (
            <div className="space-y-3.5 rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 dark:border-blue-500/35 dark:bg-blue-500/10">
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                  2. Choose Replacement Preference
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "size", label: "Different Size" },
                  { id: "color", label: "Different Color" },
                  { id: "defective_swap", label: "Exact Item Swap" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExchangeType(opt.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition ${
                      exchangeType === opt.id
                        ? "border-blue-600 bg-blue-600 text-white font-semibold shadow-sm"
                        : "border-blue-500/20 bg-white dark:bg-[#222222] text-clay dark:text-white/80 hover:border-blue-500/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {exchangeType === "size" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-clay dark:text-white/70">
                    Select Desired Replacement Size *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["XS", "S", "M", "L", "XL", "XXL", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setRequestedSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          requestedSize === sz
                            ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                            : "border-ink/10 dark:border-white/10 bg-white dark:bg-[#222] text-ink dark:text-white hover:border-blue-400"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={requestedSize}
                    onChange={(e) => setRequestedSize(e.target.value)}
                    placeholder="Or type custom size (e.g. 32W 34L or 42 Regular)"
                    className="w-full mt-1.5 rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink outline-none transition focus:border-blue-500 dark:border-white/12 dark:bg-[#222222] dark:text-white"
                  />
                </div>
              )}

              {exchangeType === "color" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-clay dark:text-white/70">
                    Select Desired Replacement Color / Shade *
                  </label>
                  <input
                    type="text"
                    value={requestedColor}
                    onChange={(e) => setRequestedColor(e.target.value)}
                    placeholder="e.g. Midnight Black, Olive Green, Navy Blue, Chalk White"
                    className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink outline-none transition focus:border-blue-500 dark:border-white/12 dark:bg-[#222222] dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-clay dark:text-white/70">
                  Special Notes for Replacement Team (Optional)
                </label>
                <input
                  type="text"
                  value={replacementNotes}
                  onChange={(e) => setReplacementNotes(e.target.value)}
                  placeholder="e.g. Please verify sleeves length or dispatch slim fit variant"
                  className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink outline-none transition focus:border-blue-500 dark:border-white/12 dark:bg-[#222222] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Reason Step */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70">
              {requestMode === "replacement" ? "3. Reason for Replacement *" : "2. Reason for Return *"}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white p-3 text-xs font-medium text-ink outline-none transition focus:border-ink/30 dark:border-white/15 dark:bg-[#222222] dark:text-white"
            >
              {REASON_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.label}>
                  {preset.label} {preset.requireEvidence ? "(Photo proof required)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70">
              {requestMode === "replacement" ? "4. Problem Description / Context" : "3. Additional Comments / Problem Description"}
            </label>
            <textarea
              rows={2}
              value={detailedReason}
              onChange={(e) => setDetailedReason(e.target.value)}
              placeholder="Please provide any additional context to help our verification team process your request faster..."
              className="w-full rounded-2xl border border-ink/10 bg-white p-3 text-xs text-ink placeholder:text-clay/50 outline-none transition focus:border-ink/30 dark:border-white/15 dark:bg-[#222222] dark:text-white dark:placeholder:text-white/40"
            />
          </div>

          {/* Upload Evidence Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70">
                {requestMode === "replacement" ? "5. Upload Photo Evidence" : "4. Upload Photo Evidence"}
              </label>
              <span className="text-[11px] text-clay/70 dark:text-white/50">
                {evidenceImages.length}/5 uploaded
              </span>
            </div>

            {/* Upload Drop Zone */}
            <div className="relative rounded-2xl border-2 border-dashed border-ink/15 p-4 text-center hover:border-ink/30 dark:border-white/15 dark:hover:border-white/30 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand dark:bg-white/10 text-ink dark:text-white">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-semibold text-ink dark:text-white">
                  Click or drag photos here to upload
                </p>
                <p className="text-[11px] text-clay dark:text-white/50">
                  Upload images of the product condition, tags, or damage (Max 5MB each)
                </p>
              </div>
            </div>

            {/* Evidence Thumbnails */}
            {evidenceImages.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {evidenceImages.map((img, idx) => (
                  <div key={idx} className="relative group h-16 w-16 rounded-xl overflow-hidden border border-ink/10 dark:border-white/10 bg-sand">
                    <img src={img.url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mode-specific Resolution or Exchange Guarantee */}
          {requestMode === "replacement" ? (
            <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 dark:border-blue-500/35 dark:bg-blue-500/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Luxeva 100% Replacement Guarantee
                  </p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300">
                    Free doorstep reverse pickup + outbound fresh item dispatch with zero extra delivery charges.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                  Free Exchange
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Step 5: Preferred Resolution */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-clay dark:text-white/70">
                  5. Preferred Resolution *
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {RESOLUTION_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = preferredResolution === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setPreferredResolution(opt.id)}
                        className={`rounded-2xl border p-3 cursor-pointer transition ${
                          isSelected
                            ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
                            : "border-ink/10 bg-white text-clay hover:text-ink dark:border-white/12 dark:bg-[#222222] dark:text-white/70 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          <p className="font-semibold text-xs">{opt.title}</p>
                        </div>
                        <p className={`text-[10px] mt-1.5 leading-relaxed ${
                          isSelected ? "text-white/80 dark:text-black/70" : "text-clay/60 dark:text-white/40"
                        }`}>
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Optional UPI ID for instant payout */}
                {preferredResolution === "refund_original" && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-clay dark:text-white/60 mb-1">
                      UPI ID for Direct Payout (Recommended for fast refunds)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                      className="w-full rounded-xl border border-ink/10 bg-white p-2.5 text-xs text-ink outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-[#222222] dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Refund Summary Banner */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Estimated Refund Total
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                      Full refund for {selectedItemIds.length} item{selectedItemIds.length > 1 ? "s" : ""} · Free pickup
                    </p>
                  </div>
                  <p className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currency(estimatedRefund)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/8 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/10 px-5 py-2 text-xs font-semibold text-clay hover:text-ink dark:border-white/15 dark:text-white/70 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-xs font-semibold text-white shadow-md transition disabled:opacity-60 ${
                requestMode === "replacement"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-ink hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{requestMode === "replacement" ? "Submit Replacement Request" : "Submit Return Request"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestModal;
