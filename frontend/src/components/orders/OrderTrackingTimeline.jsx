import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Truck,
  Package,
  Box,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { shortDate } from "../../utils/format";

const STAGES = [
  { key: "placed", label: "Order Placed", icon: Box },
  { key: "packed", label: "Processing & Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 }
];

const getStageIndex = (status) => {
  const normalized = String(status || "").toLowerCase().replace("-", "_");
  const idx = STAGES.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
};

export const OrderTrackingTimeline = ({ order }) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const currentStageIndex = getStageIndex(order.status);
  const timeline = order.timeline || [];
  const shipping = order.shipping || {};

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find latest timeline event for each stage to show exact timestamps
  const getStageDate = (stageKey) => {
    const item = [...timeline]
      .reverse()
      .find((t) => t.status?.toLowerCase()?.replace("-", "_") === stageKey);
    return item ? shortDate(item.at) : null;
  };

  const latestNote = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <div className="mt-4 rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4 dark:border-white/10">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/50 dark:text-white/50">
            Live Order Tracking
          </span>
          <h3 className="font-display text-xl font-semibold text-ink dark:text-white">
            Order #{order.orderNumber}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> Cancelled
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-olive/10 px-3.5 py-1.5 text-xs font-semibold text-olive dark:bg-white/10 dark:text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-olive opacity-75 dark:bg-white" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-olive dark:bg-white" />
              </span>
              {STAGES[currentStageIndex]?.label || order.status}
            </span>
          )}
        </div>
      </div>

      {/* Cancelled Alert */}
      {isCancelled ? (
        <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-center text-sm font-medium text-red-600 dark:text-red-400">
          This order was cancelled. If you were charged, your refund will be processed within 5-7 business days.
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
                const isFuture = idx > currentStageIndex;
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
                          ? "text-ink dark:text-white"
                          : isCompleted
                          ? "text-ink/80 dark:text-white/80"
                          : "text-ink/40 dark:text-white/40"
                      }`}
                    >
                      {stage.label}
                    </p>

                    {stageDate && (
                      <span className="mt-0.5 text-[10px] text-ink/50 dark:text-white/40">
                        {stageDate}
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
                          isCurrent ? "text-ink dark:text-white" : "text-ink/70 dark:text-white/60"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {stageDate && (
                        <p className="text-xs text-ink/40 dark:text-white/40">{stageDate}</p>
                      )}
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
          <Clock size={16} className="mt-0.5 shrink-0 text-ink/60 dark:text-white/60" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 dark:text-white/40">
              Latest Update
            </p>
            <p className="text-sm font-medium text-ink dark:text-white">{latestNote.note}</p>
            {latestNote.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-ink/60 dark:text-white/60">
                <MapPin size={12} /> {latestNote.location}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Shipping Details Card */}
      {(shipping.carrier || shipping.trackingNumber || shipping.estimatedDelivery) && (
        <div className="mt-6 grid gap-4 rounded-2xl border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-3">
          {shipping.carrier && (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold">Courier / Carrier</p>
              <p className="mt-0.5 text-sm font-semibold text-ink dark:text-white">
                {shipping.carrier}
              </p>
            </div>
          )}

          {shipping.trackingNumber && (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold">Tracking Number (AWB)</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-ink dark:text-white">
                  {shipping.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shipping.trackingNumber)}
                  title="Copy tracking number"
                  className="rounded p-1 text-ink/50 transition hover:bg-ink/10 hover:text-ink dark:text-white/50 dark:hover:text-white"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {shipping.estimatedDelivery && (
            <div>
              <p className="text-xs text-ink/50 dark:text-white/40 font-semibold">Estimated Delivery</p>
              <p className="mt-0.5 text-sm font-semibold text-ink dark:text-white">
                {shortDate(shipping.estimatedDelivery)}
              </p>
            </div>
          )}

          {shipping.trackingUrl && (
            <div className="sm:col-span-3">
              <a
                href={shipping.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
              >
                Track on {shipping.carrier || "Courier"} Website
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Expandable Activity Log / Audit Trail */}
      {timeline.length > 0 && (
        <div className="mt-6 border-t border-ink/10 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between text-xs font-semibold text-ink/60 transition hover:text-ink dark:text-white/60 dark:hover:text-white"
          >
            <span>Activity Log ({timeline.length} updates)</span>
            <span>{showHistory ? "Hide ▲" : "View Details ▼"}</span>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3 pl-2">
              {[...timeline].reverse().map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3 border-l-2 border-ink/20 pl-4 pb-2 dark:border-white/20">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-ink dark:bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold capitalize text-ink dark:text-white">
                      {event.status?.replace("_", " ")}
                    </p>
                    <p className="text-xs text-ink/70 dark:text-white/70">{event.note}</p>
                    {event.location && (
                      <p className="text-[11px] text-ink/50 dark:text-white/50">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-ink/40 dark:text-white/40 shrink-0">
                    {shortDate(event.at)}
                  </span>
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
