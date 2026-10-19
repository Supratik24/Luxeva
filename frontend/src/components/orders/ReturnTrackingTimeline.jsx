import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  XCircle,
  FileText,
  RotateCcw,
  ExternalLink,
  ImageIcon,
  X,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { currency, shortDate } from "../../utils/format";

const STAGES = [
  { key: "requested", label: "Request Placed", desc: "Quality team review" },
  { key: "approved", label: "Pickup Scheduled", desc: "Reverse logistics assigned" },
  { key: "picked_up", label: "Item Collected", desc: "In transit to hub" },
  { key: "inspected", label: "Inspection Passed", desc: "Condition verified" },
  { key: "refunded", label: "Refund Credited", desc: "Payout completed" }
];

const getStageIndex = (status) => {
  switch (status) {
    case "requested":
      return 0;
    case "approved":
      return 1;
    case "picked_up":
      return 2;
    case "inspected":
      return 3;
    case "refunded":
      return 4;
    default:
      return 0;
  }
};

const ReturnTrackingTimeline = ({ order }) => {
  const returnReq = order?.returnRequest;
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!returnReq || returnReq.status === "none") {
    return null;
  }

  const isRejected = returnReq.status === "rejected";
  const currentIndex = getStageIndex(returnReq.status);
  const decision = returnReq.adminDecision || {};

  return (
    <div className="mt-4 rounded-3xl border border-ink/10 bg-white p-5 sm:p-7 shadow-card dark:border-white/12 dark:bg-[#1a1a1a] text-ink dark:text-white">
      {/* Return Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-ink/8 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            isRejected
              ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
              : returnReq.status === "refunded"
              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          }`}>
            <RotateCcw size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-clay dark:text-white/60">
                {returnReq.returnId || "RET-PENDING"}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isRejected
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                  : returnReq.status === "refunded"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
              }`}>
                {returnReq.status?.replace("_", " ")}
              </span>
            </div>
            <p className="font-display text-base sm:text-lg font-bold mt-0.5">
              {isRejected
                ? "Return Request Rejected"
                : returnReq.status === "refunded"
                ? "Refund Completed & Credited"
                : "Return & Refund in Progress"}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-clay dark:text-white/60">Estimated Refund</p>
          <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {currency(returnReq.refundAmount || order.total)}
          </p>
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {isRejected ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs dark:bg-rose-500/15">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 mb-1">
            <XCircle size={16} />
            <span>Return Request Not Approved</span>
          </div>
          <p className="text-rose-800/90 dark:text-rose-200 leading-relaxed">
            {decision.rationale || "Our quality assurance team was unable to authorize this return based on policy conditions. If you believe this is an error, please reach out to Luxeva Concierge."}
          </p>
        </div>
      ) : (
        /* Active Stepper Lifecycle */
        <div className="mt-8">
          <div className="relative">
            {/* Background connecting bar */}
            <div className="absolute top-4 left-6 right-6 hidden md:block h-1 bg-ink/10 dark:bg-white/10 rounded-full" />
            <div
              className="absolute top-4 left-6 hidden md:block h-1 bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentIndex / (STAGES.length - 1)) * 92}%` }}
            />

            {/* Stepper nodes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;

                return (
                  <div key={stage.key} className="flex md:flex-col items-center gap-3 md:text-center">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isPassed
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "border-ink/20 bg-white text-clay dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white/40"
                      }`}
                    >
                      {idx < currentIndex ? (
                        <CheckCircle2 size={16} />
                      ) : isCurrent ? (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                        </span>
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <p className={`text-xs font-bold ${
                        isCurrent ? "text-ink dark:text-white" : isPassed ? "text-clay dark:text-white/80" : "text-clay/50 dark:text-white/40"
                      }`}>
                        {stage.label}
                      </p>
                      <p className="text-[10px] text-clay/70 dark:text-white/50 leading-tight">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Decision & Action Callout Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Pickup Logistics Info */}
        <div className="rounded-2xl border border-ink/8 bg-sand/40 p-4 dark:border-white/10 dark:bg-white/5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
            <Truck size={15} className="text-blue-500" />
            <span>Doorstep Reverse Pickup</span>
          </div>
          {decision.pickupCarrier ? (
            <div className="space-y-1 text-clay dark:text-white/75">
              <p>Carrier: <strong>{decision.pickupCarrier}</strong></p>
              {decision.pickupDate && <p>Scheduled Date: <strong>{shortDate(decision.pickupDate)}</strong></p>}
              {decision.pickupTrackingNumber && (
                <p>Tracking Number: <strong className="font-mono">{decision.pickupTrackingNumber}</strong></p>
              )}
            </div>
          ) : (
            <p className="text-clay/70 dark:text-white/50">
              Courier pickup details will appear here once our verification team completes the initial review.
            </p>
          )}
        </div>

        {/* Refund Payout Info */}
        <div className="rounded-2xl border border-ink/8 bg-sand/40 p-4 dark:border-white/10 dark:bg-white/5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
            <CreditCard size={15} className="text-emerald-500" />
            <span>Refund Settlement</span>
          </div>
          <div className="space-y-1 text-clay dark:text-white/75">
            <p>Preferred Method: <strong>{returnReq.preferredResolution?.replace("_", " ") || "Original Payment"}</strong></p>
            {decision.refundTransactionId && (
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Ref ID: {decision.refundTransactionId}
              </p>
            )}
            <p className="text-[11px] text-clay/70 dark:text-white/50">
              {returnReq.status === "refunded"
                ? "Full amount credited successfully to customer account."
                : "Will be credited automatically upon warehouse inspection."}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Reason & Uploaded Evidence Photos */}
      <div className="mt-6 pt-5 border-t border-ink/8 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-clay dark:text-white/70">Return Reason:</span>
          <span className="font-bold text-ink dark:text-white">{returnReq.reason}</span>
        </div>

        {returnReq.detailedReason && (
          <p className="rounded-xl bg-ink/5 p-3 text-xs text-clay dark:bg-white/5 dark:text-white/70 leading-relaxed italic">
            "{returnReq.detailedReason}"
          </p>
        )}

        {/* Evidence Photos Gallery */}
        {returnReq.evidence && returnReq.evidence.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-semibold text-clay dark:text-white/70">
              Uploaded Evidence Photos ({returnReq.evidence.length})
            </p>
            <div className="flex flex-wrap gap-2.5">
              {returnReq.evidence.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(photo.url)}
                  className="group relative h-16 w-16 rounded-xl overflow-hidden border border-ink/10 cursor-pointer shadow-xs transition hover:scale-105 dark:border-white/15"
                >
                  <img src={photo.url} alt="Return evidence" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
                    View
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Milestone Updates Log */}
      {returnReq.timeline && returnReq.timeline.length > 0 && (
        <div className="mt-6 pt-5 border-t border-ink/8 dark:border-white/10 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-clay/70 dark:text-white/50">
            Lifecycle Milestone Updates
          </p>
          <div className="space-y-2">
            {returnReq.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink dark:text-white">{item.title}</p>
                    <span className="text-[10px] font-mono text-clay/60 dark:text-white/40">
                      {item.at ? new Date(item.at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-[11px] text-clay dark:text-white/60 mt-0.5 leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Full evidence view" className="max-h-[80vh] w-auto object-contain rounded-2xl" />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
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

export default ReturnTrackingTimeline;
