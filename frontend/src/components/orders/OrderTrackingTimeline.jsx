import { useState } from "react";
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
    const item = [...timeline]
      .reverse()
      .find((t) => t.status?.toLowerCase()?.replace("-", "_") === stageKey);
    return item ? shortDate(item.at) : null;
  };

  const latestNote = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <div className="mt-4 rounded-3xl border border-ink/10 bg-white/90 p-6 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4 dark:border-white/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50 dark:text-white/50">
            Real-Time Delivery Tracking
          </span>
          <h3 className="font-display text-xl font-semibold text-ink dark:text-white">
            Order #{order.orderNumber}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Badge (Fastest Delivery or Slightly Delayed) - Never show on cancelled orders */}
          {!isCancelled && speedBadge && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${speedBadge.colorClass}`}
            >
              {speedBadge.tag}
            </span>
          )}

          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 dark:bg-ink" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-ink" />
              </span>
              {STAGES[currentStageIndex]?.label || order.status?.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Cancelled Alert Banner */}
      {isCancelled ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center dark:bg-red-500/15">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400 mb-2">
            <AlertCircle size={22} />
          </div>
          <h4 className="font-display text-base font-bold text-red-700 dark:text-red-400">
            Order Cancelled
          </h4>
          <p className="mt-1 text-xs font-semibold text-red-600/90 dark:text-red-300/90 max-w-md mx-auto">
            {order.payment?.method === "cod"
              ? "This order was cancelled. Since this was a Cash on Delivery order, no amount was deducted."
              : "This order was cancelled. Any deducted amount will be refunded to your original payment method within 5-7 business days."}
          </p>
        </div>
      ) : (
        /* Progress Stepper */
        <div className="mt-8">
          <div className="relative">
            {/* Desktop Stepper */}
            <div className="hidden grid-cols-5 gap-2 sm:grid">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const stageDate = getStageDate(stage.key);

                return (
                  <div key={stage.key} className="relative flex flex-col items-center text-center">
                    {/* Horizontal Connector Line */}
                    {idx > 0 && (
                      <div
                        className={`absolute right-1/2 top-5 -z-0 h-1 w-full -translate-y-1/2 transition-all duration-500 ${
                          idx <= currentStageIndex
                            ? "bg-ink dark:bg-white"
                            : "bg-ink/10 dark:bg-white/10"
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-ink text-white shadow-md dark:bg-white dark:text-ink"
                          : isCurrent
                          ? "bg-ink text-white ring-4 ring-ink/20 shadow-lg dark:bg-white dark:text-ink dark:ring-white/30"
                          : "border-2 border-ink/20 bg-white text-ink/30 dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white/30"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Stage Label & Date */}
                    <p
                      className={`mt-3 text-xs font-semibold ${
                        isCurrent
                          ? "text-ink font-bold dark:text-white"
                          : isCompleted
                          ? "text-ink/80 dark:text-white/80"
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
            <div className="space-y-4 sm:hidden">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const stageDate = getStageDate(stage.key);

                return (
                  <div key={stage.key} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isCompleted || isCurrent
                          ? "bg-ink text-white dark:bg-white dark:text-ink"
                          : "border border-ink/20 text-ink/30 dark:border-white/20 dark:text-white/30"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent ? "text-ink font-bold dark:text-white" : "text-ink/70 dark:text-white/60"
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
      )}

      {/* Latest Status Note Banner */}
      {latestNote?.note && !isCancelled && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-ink/5 p-4 dark:bg-white/5">
          <Clock size={18} className="mt-0.5 shrink-0 text-ink/70 dark:text-white/70" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-white/50">
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
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-ink/70 dark:text-white/70">
                <MapPin size={13} className="text-red-500" /> Current Location: {latestNote.location}
              </p>
            )}
          </div>
        </div>
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
                Track Live on {shipping.carrier || "Courier"} Official Website
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

          {showHistory && (
            <div className="mt-4 space-y-3 pl-2">
              {[...timeline].reverse().map((event, idx) => (
                <div
                  key={idx}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingTimeline;
