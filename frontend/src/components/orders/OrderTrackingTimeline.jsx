import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Truck,
  Package,
  Box,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle
} from "lucide-react";
import { shortDate } from "../../utils/format";

const STAGES = [
  { key: "placed", label: "Order Placed", icon: Box },
  { key: "packed", label: "Packed & Ready", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 }
];

const getStageIndex = (status) => {
  const normalized = String(status || "").toLowerCase().replace("-", "_");
  const idx = STAGES.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
};

export const cleanCustomerNote = (note = "", status = "") => {
  if (!note) return "";
  
  if (/by admin/i.test(note) || /marked as/i.test(note) || /status updated to/i.test(note)) {
    const key = String(status || "").toLowerCase().replace("-", "_");
    const defaults = {
      placed: "Order confirmed and being prepared",
      packed: "Package packed and ready for dispatch",
      shipped: "Package handed over to courier and in transit",
      out_for_delivery: "Package is out for delivery to your address",
      delivered: "Package delivered successfully",
      cancelled: "Order cancelled — any deducted amount will be refunded to your original payment method"
    };
    return defaults[key] || `Package is ${key.replace(/_/g, " ")}`;
  }
  
  return note.replace(/\s*(?:by|via)?\s*admin/gi, "").trim();
};

export const computeDeliveryTiming = (order) => {
  if (!order || order.status === "cancelled") {
    return {
      isCancelled: true,
      isDelivered: false,
      actualDeliveryDate: null,
      speedBadge: null
    };
  }

  const shipping = order.shipping || {};
  const isDelivered = order.status === "delivered";
  const timeline = order.timeline || [];

  const deliveredEvent = [...timeline]
    .reverse()
    .find((t) => t.status?.toLowerCase()?.replace("-", "_") === "delivered");
  const actualDeliveryDate = deliveredEvent?.at || order.updatedAt;

  if (!shipping.estimatedDelivery) {
    return {
      isDelivered,
      actualDeliveryDate: isDelivered ? actualDeliveryDate : null,
      speedBadge: null
    };
  }

  const estDate = new Date(shipping.estimatedDelivery);
  const estDay = new Date(estDate.getFullYear(), estDate.getMonth(), estDate.getDate()).getTime();

  if (isDelivered) {
    const actDate = new Date(actualDeliveryDate);
    const actDay = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate()).getTime();

    if (actDay < estDay) {
      return {
        isDelivered: true,
        actualDeliveryDate,
        speedBadge: {
          label: "Fastest Delivery",
          icon: Zap,
          tag: "⚡ Fastest Delivery",
          description: "Delivered ahead of estimated schedule!",
          colorClass: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        }
      };
    } else if (actDay > estDay) {
      return {
        isDelivered: true,
        actualDeliveryDate,
        speedBadge: {
          label: "Slightly Delayed",
          icon: AlertTriangle,
          tag: "⚠️ Slightly Delayed",
          description: "Delivered with a slight delay",
          colorClass: "bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
        }
      };
    } else {
      return {
        isDelivered: true,
        actualDeliveryDate,
        speedBadge: {
          label: "Delivered On Time",
          icon: CheckCircle2,
          tag: "✅ Delivered On Time",
          description: "Delivered right on schedule",
          colorClass: "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300"
        }
      };
    }
  }

  // Not delivered yet
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  if (todayDay > estDay) {
    return {
      isDelivered: false,
      actualDeliveryDate: null,
      speedBadge: {
        label: "Slightly Delayed",
        icon: AlertTriangle,
        tag: "⚠️ Slightly Delayed",
        description: "Delivery is running slightly behind schedule",
        colorClass: "bg-amber-500/10 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
      }
    };
  }

  return {
    isDelivered: false,
    actualDeliveryDate: null,
    speedBadge: null
  };
};

export const OrderTrackingTimeline = ({ order }) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const currentStageIndex = getStageIndex(order.status);
  const timeline = order.timeline || [];
  const shipping = order.shipping || {};
  const { isDelivered, actualDeliveryDate, speedBadge } = computeDeliveryTiming(order);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStageDate = (stageKey) => {
    if (stageKey === "cancelled") {
      const item = [...timeline]
        .reverse()
        .find((t) => String(t.status || "").toLowerCase() === "cancelled");
      return item ? shortDate(item.at) : shortDate(order.updatedAt || order.createdAt);
    }
    const item = [...timeline]
      .reverse()
      .find((t) => String(t.status || "").toLowerCase()?.replace("-", "_") === stageKey);
    if (item) return shortDate(item.at);
    if (stageKey === "placed") return shortDate(order.createdAt);
    return null;
  };

  // If order is cancelled, compute milestones achieved up to cancellation point
  let stagesToRender = STAGES;
  if (isCancelled) {
    const activeKeys = ["placed", "packed", "shipped", "out_for_delivery"];
    let lastAchievedIdx = 0;
    timeline.forEach((item) => {
      const s = String(item.status || "").toLowerCase().replace("-", "_");
      const idx = activeKeys.indexOf(s);
      if (idx > lastAchievedIdx) {
        lastAchievedIdx = idx;
      }
    });

    const achieved = activeKeys.slice(0, lastAchievedIdx + 1).map((k) => {
      return STAGES.find((s) => s.key === k) || { key: k, label: k, icon: Box };
    });

    stagesToRender = [
      ...achieved,
      {
        key: "cancelled",
        label: "Cancelled",
        icon: AlertCircle,
        isCancelledMilestone: true
      }
    ];
  }

  const latestNote = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mt-4 rounded-3xl border border-ink/10 bg-white/90 p-6 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-[#1e1e1e]"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4 dark:border-white/10">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/50 dark:text-white/50">
            {!isCancelled && !isDelivered && (
              <span className="relative flex h-2 w-2">
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
                  animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            {isDelivered ? "Delivery Completed" : isCancelled ? "Order Cancelled" : "Live Delivery Tracking"}
          </span>
          <h3 className="font-display text-xl font-semibold text-ink dark:text-white">
            Order #{order.orderNumber}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Badge (Fastest Delivery or Slightly Delayed) - Never show on cancelled orders */}
          {!isCancelled && speedBadge && (
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${speedBadge.colorClass} shadow-sm`}
            >
              {speedBadge.tag}
            </motion.span>
          )}

          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> Cancelled
            </span>
          ) : isDelivered ? (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-ink shadow-sm"
            >
              <CheckCircle2 size={14} /> Delivered
            </motion.span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-ink shadow-sm">
              <span className="relative flex h-2 w-2">
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 dark:bg-ink"
                  animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-ink" />
              </span>
              {STAGES[currentStageIndex]?.label || order.status?.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Progress Stepper (Renders for ALL orders including Cancelled, Flipkart style) */}
      <div className="mt-8">
        <div className="relative">
          {/* Desktop Stepper */}
          <div
            className={`hidden gap-2 sm:grid ${
              stagesToRender.length === 2
                ? "grid-cols-2 max-w-md mx-auto"
                : stagesToRender.length === 3
                ? "grid-cols-3 max-w-xl mx-auto"
                : stagesToRender.length === 4
                ? "grid-cols-4 max-w-2xl mx-auto"
                : "grid-cols-5"
            }`}
          >
            {stagesToRender.map((stage, idx) => {
              const Icon = stage.icon;
              const isLineToCancelled = isCancelled && idx === stagesToRender.length - 1;
              const isAchievedBeforeCancel = isCancelled && idx < stagesToRender.length - 1;
              const isCancelledNode = isCancelled && idx === stagesToRender.length - 1;
              const isCompleted = !isCancelled && idx < currentStageIndex;
              const isCurrent = !isCancelled && idx === currentStageIndex;
              const stageDate = getStageDate(stage.key);

              return (
                <div key={stage.key} className="relative flex flex-col items-center text-center">
                  {/* Horizontal Connector Line */}
                  {idx > 0 && (
                    <div className="absolute right-1/2 top-5 -z-0 h-1 w-full -translate-y-1/2 bg-ink/10 dark:bg-white/10 overflow-hidden rounded-full">
                      {isLineToCancelled ? (
                        /* RED LINE from last achieved milestone to Cancelled */
                        <motion.div
                          className="h-full bg-red-500 dark:bg-red-500 rounded-full"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          style={{ originX: 0 }}
                          transition={{ duration: 0.6, delay: (idx - 1) * 0.12, ease: "easeOut" }}
                        />
                      ) : isCancelled ? (
                        /* GREEN LINE between milestones achieved before cancellation */
                        <motion.div
                          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          style={{ originX: 0 }}
                          transition={{ duration: 0.5, delay: (idx - 1) * 0.1, ease: "easeOut" }}
                        />
                      ) : (
                        /* GREEN LINE for completed/active milestones in normal orders */
                        <>
                          <motion.div
                            className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: idx <= currentStageIndex ? 1 : 0 }}
                            style={{ originX: 0 }}
                            transition={{ duration: 0.5, delay: (idx - 1) * 0.1, ease: "easeOut" }}
                          />
                          {/* Animated traveling light particle on active in-transit segment */}
                          {idx === currentStageIndex && !isDelivered && (
                            <motion.div
                              className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-emerald-200/80"
                              animate={{ left: ["-20%", "120%"] }}
                              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Step Icon Node */}
                  <div className="relative">
                    {/* Live Radar Ripple Ring for Current Active Stage */}
                    {isCurrent && !isDelivered && (
                      <motion.span
                        className="absolute -inset-2 rounded-full border-2 border-emerald-500 dark:border-emerald-400 opacity-50 pointer-events-none"
                        animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}

                    {/* Delivered celebration soft glow */}
                    {isCurrent && isDelivered && (
                      <motion.span
                        className="absolute -inset-1.5 rounded-full bg-emerald-500/25 blur-sm pointer-events-none"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      />
                    )}

                    <motion.div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                        isCancelledNode
                          ? "bg-red-600 text-white ring-4 ring-red-500/25 shadow-lg dark:bg-red-500 dark:text-white"
                          : isAchievedBeforeCancel || isCompleted || (isCurrent && isDelivered)
                          ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500 dark:text-ink"
                          : isCurrent
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-lg dark:bg-emerald-500 dark:text-ink"
                          : "border-2 border-ink/20 bg-white text-ink/30 dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white/30"
                      }`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.35, delay: idx * 0.08 }}
                      whileHover={{ scale: 1.12 }}
                    >
                      <motion.div
                        animate={
                          isCurrent && !isDelivered
                            ? { y: [0, -2, 0] }
                            : isCurrent && isDelivered
                            ? { scale: [1, 1.15, 1] }
                            : {}
                        }
                        transition={
                          isCurrent && !isDelivered
                            ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                            : { duration: 0.6 }
                        }
                      >
                        {isCancelledNode ? (
                          <AlertCircle size={18} />
                        ) : isAchievedBeforeCancel || isCompleted || (isCurrent && isDelivered) ? (
                          <Check size={18} className="stroke-[2.5]" />
                        ) : (
                          <Icon size={18} />
                        )}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Stage Label & Date */}
                  <p
                    className={`mt-3 text-xs font-semibold ${
                      isCancelledNode
                        ? "text-red-600 font-bold dark:text-red-400"
                        : isCurrent
                        ? "text-emerald-600 font-bold dark:text-emerald-400"
                        : isAchievedBeforeCancel || isCompleted
                        ? "text-ink font-semibold dark:text-white"
                        : "text-ink/40 dark:text-white/40"
                    }`}
                  >
                    {stage.label}
                  </p>

                  {stageDate ? (
                    <span className="mt-0.5 text-[10px] font-medium text-ink/60 dark:text-white/50">
                      {stageDate}
                    </span>
                  ) : (
                    <span className="mt-0.5 text-[10px] text-ink/25 dark:text-white/25">
                      {idx <= currentStageIndex ? "Completed" : "Pending"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="space-y-5 sm:hidden pl-2">
            {stagesToRender.map((stage, idx) => {
              const Icon = stage.icon;
              const isAchievedBeforeCancel = isCancelled && idx < stagesToRender.length - 1;
              const isCancelledNode = isCancelled && idx === stagesToRender.length - 1;
              const isCompleted = !isCancelled && idx < currentStageIndex;
              const isCurrent = !isCancelled && idx === currentStageIndex;
              const stageDate = getStageDate(stage.key);

              return (
                <div key={stage.key} className="relative flex items-start gap-3.5">
                  {/* Vertical line to next step */}
                  {idx < stagesToRender.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-8 -bottom-5 w-0.5 ${
                        isCancelled && idx === stagesToRender.length - 2
                          ? "bg-red-500 dark:bg-red-400"
                          : isCancelled || idx < currentStageIndex
                          ? "bg-emerald-500 dark:bg-emerald-400"
                          : "bg-ink/10 dark:bg-white/10"
                      }`}
                    />
                  )}

                  <div className="relative z-10 shrink-0">
                    {isCurrent && !isDelivered && (
                      <motion.span
                        className="absolute -inset-1.5 rounded-full border-2 border-emerald-500 dark:border-emerald-400 opacity-50 pointer-events-none"
                        animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      />
                    )}
                    <motion.div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isCancelledNode
                          ? "bg-red-600 text-white ring-4 ring-red-500/20 shadow-md dark:bg-red-500 dark:text-white"
                          : isAchievedBeforeCancel || isCompleted || (isCurrent && isDelivered)
                          ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500 dark:text-ink"
                          : isCurrent
                          ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-ink"
                          : "border-2 border-ink/20 bg-white text-ink/30 dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white/30"
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {isCancelledNode ? (
                        <AlertCircle size={15} />
                      ) : isAchievedBeforeCancel || isCompleted || (isCurrent && isDelivered) ? (
                        <Check size={15} className="stroke-[2.5]" />
                      ) : (
                        <Icon size={15} />
                      )}
                    </motion.div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        isCancelledNode
                          ? "text-red-600 font-bold dark:text-red-400"
                          : isCurrent
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : isAchievedBeforeCancel || isCompleted
                          ? "text-ink font-semibold dark:text-white"
                          : "text-ink/60 dark:text-white/50"
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="text-xs text-ink/50 dark:text-white/40">
                      {stageDate || (idx <= currentStageIndex ? "Completed" : "Pending")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cancelled Refund Banner (Always show below stepper on cancelled orders) */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center dark:bg-red-500/15"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400 mb-2">
            <AlertCircle size={20} />
          </div>
          <h4 className="font-display text-sm font-bold text-red-700 dark:text-red-400">
            Order Cancelled
          </h4>
          <p className="mt-1 text-xs font-semibold text-red-600/90 dark:text-red-300/90 max-w-md mx-auto">
            {order.payment?.method === "cod"
              ? "This order was cancelled. Since this was a Cash on Delivery order, no amount was deducted."
              : "This order was cancelled. Any deducted amount will be refunded to your original payment method within 5-7 business days."}
          </p>
        </motion.div>
      )}

      {/* Latest Status Note Banner */}
      {latestNote?.note && !isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6 flex items-start gap-3 rounded-2xl bg-ink/5 p-4 dark:bg-white/5 border border-ink/5 dark:border-white/5"
        >
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Clock size={18} className="mt-0.5 shrink-0 text-ink/70 dark:text-white/70" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-white/50 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Latest Checkpoint Update
              </p>
              {latestNote.at && (
                <span className="text-xs text-ink/50 dark:text-white/40">
                  {shortDate(latestNote.at)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-ink dark:text-white">
              {cleanCustomerNote(latestNote.note, latestNote.status || order.status)}
            </p>
            {latestNote.location && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink/70 dark:text-white/70">
                <motion.span
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <MapPin size={13} className="text-red-500" />
                </motion.span>
                Current Location: <span className="font-semibold text-ink dark:text-white">{latestNote.location}</span>
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Shipping Details Card */}
      {!isCancelled && (shipping.carrier || shipping.trackingNumber || shipping.estimatedDelivery || isDelivered) ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-ink/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5 sm:grid-cols-3">
          {shipping.carrier && (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold uppercase tracking-wider">
                Courier / Carrier
              </p>
              <p className="mt-1 text-base font-bold text-ink dark:text-white">
                🚚 {shipping.carrier}
              </p>
            </div>
          )}

          {shipping.trackingNumber && (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold uppercase tracking-wider">
                AWB / Tracking Number
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-base font-bold text-ink dark:text-white">
                  {shipping.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shipping.trackingNumber)}
                  title="Copy tracking number"
                  className="rounded-lg p-1.5 text-ink/60 transition hover:bg-ink/10 hover:text-ink dark:text-white/60 dark:hover:text-white"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Delivery Date block:
              When DELIVERED -> show "Delivered On: [date]" + Speed Badge. (Estimated date is REMOVED!)
              When NOT DELIVERED -> show "Estimated Delivery: [date]" + delay warning if late.
          */}
          {isDelivered ? (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold uppercase tracking-wider">
                Delivered On
              </p>
              <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                ✅ {shortDate(actualDeliveryDate)}
              </p>
              {speedBadge && (
                <p className="mt-1 text-xs font-semibold text-ink/60 dark:text-white/60">
                  {speedBadge.description}
                </p>
              )}
            </div>
          ) : (
            shipping.estimatedDelivery && (
              <div>
                <p className="text-xs text-ink/50 dark:text-white/40 font-semibold uppercase tracking-wider">
                  Estimated Delivery
                </p>
                <p className="mt-1 text-base font-bold text-ink dark:text-white">
                  🗓️ {shortDate(shipping.estimatedDelivery)}
                </p>
                {speedBadge && (
                  <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {speedBadge.description}
                  </p>
                )}
              </div>
            )
          )}

          {shipping.trackingUrl && (
            <div className="sm:col-span-3 pt-2">
              <a
                href={shipping.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-5"
              >
                {isDelivered ? "Track on" : "Track Live on"} {shipping.carrier || "Courier"} Official Website
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      ) : (
        (order.status === "shipped" || order.status === "out_for_delivery") && (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/10 p-4 text-xs text-ink/60 dark:border-white/10 dark:text-white/60">
            🚚 Package is with courier logistics. Tracking number will be synced shortly.
          </div>
        )
      )}

      {/* Expandable Activity Log / Audit Trail */}
      {timeline.length > 0 && (
        <div className="mt-6 border-t border-ink/10 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-ink/70 transition hover:text-ink dark:text-white/70 dark:hover:text-white"
          >
            <span>Checkpoint History & Tracking Log ({timeline.length} updates)</span>
            <span className="flex items-center gap-1 font-semibold text-xs lowercase">
              {showHistory ? (
                <>Collapse <ChevronUp size={14} /></>
              ) : (
                <>View all <ChevronDown size={14} /></>
              )}
            </span>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-4 space-y-3 pl-2 overflow-hidden"
              >
                {[...timeline].reverse().map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="relative flex items-start gap-3 border-l-2 border-ink/20 pl-4 pb-2 dark:border-white/20"
                  >
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-ink dark:bg-white" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold capitalize text-ink dark:text-white">
                          {event.status?.replace("_", " ")}
                        </p>
                        <span className="text-[11px] font-medium text-ink/50 dark:text-white/40 shrink-0">
                          {shortDate(event.at)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-ink/80 dark:text-white/80 mt-0.5">
                        {cleanCustomerNote(event.note, event.status)}
                      </p>
                      {event.location && (
                        <p className="text-[11px] text-ink/60 dark:text-white/60 mt-0.5">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default OrderTrackingTimeline;
