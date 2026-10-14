import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop,
  Layers,
  Sparkles,
  Smartphone,
  Monitor,
  AlertCircle,
  Eye,
  EyeOff,
  Move,
  ArrowUp,
  ArrowDown,
  AlignCenter
} from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";

const ASPECT_RATIOS = [
  { id: "4:5", label: "4:5 Hero Portrait", value: 4 / 5, desc: "Website Storefront Native (Recommended)", badge: "Recommended" },
  { id: "16:9", label: "16:9 Cinematic", value: 16 / 9, desc: "Widescreen / Landscape" },
  { id: "1:1", label: "1:1 Square", value: 1, desc: "Standard Square" },
  { id: "free", label: "Free Aspect", value: null, desc: "Custom Freeform Crop" }
];

/**
 * BannerCropModal
 * Allows admin to visually crop, position, and understand which portion
 * of the banner image will be visible in the website's hero section.
 */
const BannerCropModal = ({
  open,
  imageSrc,
  onClose,
  onApply,
  bannerData = {}
}) => {
  const [aspectId, setAspectId] = useState("4:5");
  const [crop, setCrop] = useState({ x: 0.1, y: 0.05, width: 0.8, height: 0.9 });
  const [zoom, setZoom] = useState(1);
  const [showOverlayGuide, setShowOverlayGuide] = useState(true);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [saving, setSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef({
    active: false,
    mode: null, // 'move', 'nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'
    startX: 0,
    startY: 0,
    cropStart: { x: 0, y: 0, width: 0, height: 0 }
  });

  const selectedAspect = ASPECT_RATIOS.find((a) => a.id === aspectId) || ASPECT_RATIOS[0];

  // Helper to calculate initial centered crop for a given aspect ratio
  const initCropForAspect = useCallback((aspectVal, imgW, imgH) => {
    if (!imgW || !imgH) return;
    if (!aspectVal) {
      setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
      return;
    }

    // K = (dispW / dispH) / aspectVal
    const K = (imgW / imgH) / aspectVal;
    let w, h;

    if (K >= 1) {
      // Image is wider than target ratio
      h = 0.96;
      w = h / K;
    } else {
      // Image is taller than target ratio
      w = 0.96;
      h = w * K;
    }

    const x = Math.max(0, (1 - w) / 2);
    const y = Math.max(0, (1 - h) / 2);

    setCrop({
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      width: Number(w.toFixed(4)),
      height: Number(h.toFixed(4))
    });
  }, []);

  // When image loads or aspect changes
  const handleImageLoad = (e) => {
    const nw = e.target.naturalWidth || 1000;
    const nh = e.target.naturalHeight || 800;
    setNaturalSize({ width: nw, height: nh });
    setImageLoaded(true);

    const dw = e.target.clientWidth || nw;
    const dh = e.target.clientHeight || nh;
    initCropForAspect(selectedAspect.value, dw, dh);
  };

  const handleAspectChange = (newAspectId) => {
    setAspectId(newAspectId);
    const aspect = ASPECT_RATIOS.find((a) => a.id === newAspectId);
    if (imgRef.current) {
      const dw = imgRef.current.clientWidth;
      const dh = imgRef.current.clientHeight;
      initCropForAspect(aspect?.value, dw, dh);
    }
  };

  // Quick positioning helpers
  const handleAlign = (type) => {
    setCrop((prev) => {
      let newY = prev.y;
      let newX = prev.x;
      if (type === "top") newY = 0;
      if (type === "bottom") newY = Math.max(0, 1 - prev.height);
      if (type === "center") {
        newX = Math.max(0, (1 - prev.width) / 2);
        newY = Math.max(0, (1 - prev.height) / 2);
      }
      return { ...prev, x: Number(newX.toFixed(4)), y: Number(newY.toFixed(4)) };
    });
  };

  // Drag and Resize handlers
  const handlePointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      active: true,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      cropStart: { ...crop }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active || !imgRef.current) return;

    const imgRect = imgRef.current.getBoundingClientRect();
    const dispW = imgRect.width;
    const dispH = imgRect.height;
    if (!dispW || !dispH) return;

    const dx = (e.clientX - dragRef.current.startX) / dispW;
    const dy = (e.clientY - dragRef.current.startY) / dispH;
    const { mode, cropStart } = dragRef.current;
    const aspectVal = selectedAspect.value;
    const K = aspectVal ? (dispW / dispH) / aspectVal : null;

    if (mode === "move") {
      let newX = Math.min(Math.max(0, cropStart.x + dx), 1 - cropStart.width);
      let newY = Math.min(Math.max(0, cropStart.y + dy), 1 - cropStart.height);
      setCrop((prev) => ({
        ...prev,
        x: Number(newX.toFixed(4)),
        y: Number(newY.toFixed(4))
      }));
      return;
    }

    // Resizing handles
    let { x, y, width, height } = cropStart;

    if (mode === "se") {
      let newW = Math.min(Math.max(0.15, width + dx), 1 - x);
      let newH = K ? newW * K : Math.min(Math.max(0.15, height + dy), 1 - y);

      if (K && y + newH > 1) {
        newH = 1 - y;
        newW = newH / K;
      }
      setCrop({ x, y, width: Number(newW.toFixed(4)), height: Number(newH.toFixed(4)) });
    } else if (mode === "sw") {
      let maxDx = x;
      let clampedDx = Math.max(-maxDx, Math.min(width - 0.15, dx));
      let newW = width - clampedDx;
      let newX = x + clampedDx;
      let newH = K ? newW * K : Math.min(Math.max(0.15, height + dy), 1 - y);

      if (K && y + newH > 1) {
        newH = 1 - y;
        newW = newH / K;
        newX = x + (width - newW);
      }
      setCrop({
        x: Number(newX.toFixed(4)),
        y,
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4))
      });
    } else if (mode === "ne") {
      let newW = Math.min(Math.max(0.15, width + dx), 1 - x);
      let newH = K ? newW * K : Math.min(Math.max(0.15, height - dy), y + height);
      let newY = y + height - newH;

      if (K && newY < 0) {
        newY = 0;
        newH = y + height;
        newW = newH / K;
      }
      setCrop({
        x,
        y: Number(Math.max(0, newY).toFixed(4)),
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4))
      });
    } else if (mode === "nw") {
      let clampedDx = Math.max(-x, Math.min(width - 0.15, dx));
      let newW = width - clampedDx;
      let newX = x + clampedDx;
      let newH = K ? newW * K : Math.min(Math.max(0.15, height - dy), y + height);
      let newY = y + height - newH;

      if (K && newY < 0) {
        newY = 0;
        newH = y + height;
        newW = newH / K;
        newX = x + (width - newW);
      }
      setCrop({
        x: Number(Math.max(0, newX).toFixed(4)),
        y: Number(Math.max(0, newY).toFixed(4)),
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4))
      });
    }
  }, [selectedAspect]);

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  // Clean up global listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Apply Crop & Upload / Export
  const handleApplyCrop = async () => {
    if (!imageSrc || !imgRef.current) return;
    setSaving(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // If crossOrigin fails, try without
          const fallback = new Image();
          fallback.onload = resolve;
          fallback.onerror = reject;
          fallback.src = imageSrc;
        };
        img.src = imageSrc;
      });

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      const sx = Math.round(crop.x * nw);
      const sy = Math.round(crop.y * nh);
      const sw = Math.round(crop.width * nw);
      const sh = Math.round(crop.height * nh);

      // Create high-resolution destination canvas
      let dw = sw;
      let dh = sh;
      const maxDim = 2000;
      if (dw > maxDim || dh > maxDim) {
        const ratio = Math.min(maxDim / dw, maxDim / dh);
        dw = Math.round(dw * ratio);
        dh = Math.round(dh * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, dw);
      canvas.height = Math.max(1, dh);
      const ctx = canvas.getContext("2d");

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

      // Convert to blob and upload to catalog uploads for permanent CDN URL
      canvas.toBlob(async (blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          onApply(dataUrl);
          toast.success("Crop applied!");
          onClose();
          setSaving(false);
          return;
        }

        try {
          const formData = new FormData();
          formData.append("images", blob, `banner-hero-${Date.now()}.jpg`);
          const { data } = await api.post(endpoints.catalog.uploadImages, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          const uploadedUrl = data.files?.[0]?.url;
          if (uploadedUrl) {
            onApply(uploadedUrl);
            toast.success("Crop applied and saved to library!");
          } else {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            onApply(dataUrl);
            toast.success("Crop applied!");
          }
        } catch {
          // Fallback to dataUrl on any network or upload error
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          onApply(dataUrl);
          toast.success("Crop applied!");
        } finally {
          setSaving(false);
          onClose();
        }
      }, "image/jpeg", 0.92);
    } catch (err) {
      console.error("Crop error:", err);
      toast.error("Could not process crop. Please try again.");
      setSaving(false);
    }
  };

  if (!open || !imageSrc) return null;

  // Calculated live preview dimensions
  const cropPixW = Math.round((crop.width || 0.8) * (naturalSize.width || 1000));
  const cropPixH = Math.round((crop.height || 0.9) * (naturalSize.height || 800));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-ink/75 backdrop-blur-md dark:bg-black/85"
        onClick={!saving ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1a1a1a] border border-ink/10 dark:border-white/10">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/5 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand text-ink dark:bg-white/10 dark:text-white">
              <Crop size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-ink dark:text-white">Crop & Reposition Banner</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Website Display Match
                </span>
              </div>
              <p className="text-xs text-clay dark:text-white/60">
                Frame your image to match how customers will see it on the storefront hero section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5 text-clay dark:text-white/70 dark:hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Aspect Ratio Selector Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 bg-sand/30 px-6 py-2.5 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-clay dark:text-white/60 mr-1.5 flex items-center gap-1">
              <Maximize2 size={13} /> Frame Ratio:
            </span>
            {ASPECT_RATIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAspectChange(item.id)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  aspectId === item.id
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "bg-white/80 text-clay hover:text-ink dark:bg-white/5 dark:text-white/70 dark:hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    aspectId === item.id
                      ? "bg-emerald-400 text-black"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Alignments & Overlay Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-xl bg-white/80 p-0.5 border border-ink/5 dark:bg-white/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleAlign("top")}
                title="Focus on top (Keep models/faces in view)"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 text-clay dark:text-white/70"
              >
                <ArrowUp size={12} /> Focus Top
              </button>
              <button
                type="button"
                onClick={() => handleAlign("center")}
                title="Center crop"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 text-clay dark:text-white/70"
              >
                <AlignCenter size={12} /> Center
              </button>
              <button
                type="button"
                onClick={() => handleAlign("bottom")}
                title="Focus on bottom"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-ink/5 dark:hover:bg-white/10 text-clay dark:text-white/70"
              >
                <ArrowDown size={12} /> Bottom
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowOverlayGuide((s) => !s)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition ${
                showOverlayGuide
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-white/80 border-ink/5 text-clay dark:bg-white/5 dark:border-white/10 dark:text-white/60"
              }`}
            >
              {showOverlayGuide ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Storefront Card Guide: {showOverlayGuide ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Main Body: 2 Columns (Editor Canvas & Live Storefront Preview) */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] min-w-0">
          {/* Column 1: Interactive Crop Stage */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-ink/5 dark:border-white/10 overflow-hidden bg-stone-900/95 relative select-none min-w-0">
            {/* Viewport Info Header */}
            <div className="px-5 py-2.5 bg-black/40 flex items-center justify-between text-xs text-white/80 backdrop-blur-sm border-b border-white/10">
              <span className="flex items-center gap-1.5 truncate">
                <Move size={13} className="text-amber-400 shrink-0" />
                <span className="font-semibold text-white">Drag to position frame</span> · Drag handles to resize
              </span>
              <span className="font-mono text-white/60 text-[11px] shrink-0 ml-2">
                {cropPixW} × {cropPixH} px ({selectedAspect.id})
              </span>
            </div>

            {/* Canvas / Image Display Workspace */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative min-h-[280px]" ref={containerRef}>
              <div className="relative inline-block max-h-[48vh] max-w-[92%] shadow-2xl rounded-xl overflow-hidden">
                {/* Source Image */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Banner to crop"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                  className="block max-h-[48vh] max-w-full object-contain pointer-events-none rounded-xl"
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.15s ease"
                  }}
                />

                {imageLoaded && (
                  <>
                    {/* Dark Dimmed Overlays (Clipped regions) */}
                    {/* Top Mask */}
                    <div
                      className="absolute left-0 right-0 top-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
                      style={{ height: `${crop.y * 100}%` }}
                    />
                    {/* Bottom Mask */}
                    <div
                      className="absolute left-0 right-0 bottom-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
                      style={{ height: `${(1 - (crop.y + crop.height)) * 100}%` }}
                    />
                    {/* Left Mask */}
                    <div
                      className="absolute left-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
                      style={{
                        top: `${crop.y * 100}%`,
                        height: `${crop.height * 100}%`,
                        width: `${crop.x * 100}%`
                      }}
                    />
                    {/* Right Mask */}
                    <div
                      className="absolute right-0 bg-black/70 backdrop-blur-[1px] pointer-events-none"
                      style={{
                        top: `${crop.y * 100}%`,
                        height: `${crop.height * 100}%`,
                        width: `${(1 - (crop.x + crop.width)) * 100}%`
                      }}
                    />

                    {/* Active Crop Box */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, "move")}
                      className="absolute cursor-move border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] group transition-shadow"
                      style={{
                        left: `${crop.x * 100}%`,
                        top: `${crop.y * 100}%`,
                        width: `${crop.width * 100}%`,
                        height: `${crop.height * 100}%`
                      }}
                    >
                      {/* Rule of Thirds Gridlines */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                        <div className="border-r border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-b border-white/60" />
                        <div className="border-r border-white/60" />
                        <div className="border-r border-white/60" />
                        <div />
                      </div>

                      {/* Visible Viewport Badge */}
                      <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Visible on Storefront ({selectedAspect.id})
                      </div>

                      {/* Safe Area Indicator */}
                      <div className="absolute top-9 left-2 right-2 pointer-events-none">
                        <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">
                          ✦ Primary Focus Safe Zone
                        </span>
                      </div>

                      {/* Storefront Floating Card Overlay Guide */}
                      {showOverlayGuide && aspectId === "4:5" && (
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-xl border border-white/20 bg-white/25 p-2.5 text-white backdrop-blur-md shadow-lg pointer-events-none">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                              ⚠ Storefront Card Overlay
                            </span>
                            <span className="text-[9px] text-white/80 font-medium">Covers lower 22%</span>
                          </div>
                          <p className="text-[10px] font-semibold text-white truncate leading-tight">
                            {bannerData?.title || "Fine things, effortlessly found"}
                          </p>
                          <p className="text-[8px] text-white/70 truncate mt-0.5">
                            Keep faces & main subject above this zone!
                          </p>
                        </div>
                      )}

                      {/* Corner Handles */}
                      <div
                        onPointerDown={(e) => handlePointerDown(e, "nw")}
                        className="absolute -left-2 -top-2 h-4 w-4 rounded-sm bg-white border-2 border-stone-900 cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, "ne")}
                        className="absolute -right-2 -top-2 h-4 w-4 rounded-sm bg-white border-2 border-stone-900 cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, "se")}
                        className="absolute -right-2 -bottom-2 h-4 w-4 rounded-sm bg-white border-2 border-stone-900 cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, "sw")}
                        className="absolute -left-2 -bottom-2 h-4 w-4 rounded-sm bg-white border-2 border-stone-900 cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Controls inside Canvas Stage */}
            <div className="px-6 py-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-4 text-xs text-white">
              {/* Zoom slider */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(1))))}
                  className="p-1 rounded hover:bg-white/10 text-white/80"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-24 sm:w-32 accent-white h-1 bg-white/20 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
                  className="p-1 rounded hover:bg-white/10 text-white/80"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <span className="font-mono text-white/70 ml-1">{Math.round(zoom * 100)}%</span>
              </div>

              {/* Reset to fit */}
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  if (imgRef.current) {
                    initCropForAspect(selectedAspect.value, imgRef.current.clientWidth, imgRef.current.clientHeight);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs"
              >
                <RotateCw size={12} /> Reset Framing
              </button>
            </div>
          </div>

          {/* Column 2: Live Storefront Mockup Preview */}
          <div className="flex flex-col bg-sand/30 dark:bg-[#151515] overflow-y-auto p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-ink dark:text-white">
                  <Sparkles size={15} className="text-amber-500" />
                  Live Storefront Simulation
                </h3>
                <p className="text-[11px] text-clay dark:text-white/60">
                  Exact preview of how customers see this banner on Luxeva.
                </p>
              </div>

              {/* Device switcher */}
              <div className="flex items-center rounded-xl bg-white dark:bg-white/10 p-0.5 border border-ink/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg transition ${
                    previewDevice === "desktop"
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "text-clay dark:text-white/60"
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg transition ${
                    previewDevice === "mobile"
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "text-clay dark:text-white/60"
                  }`}
                  title="Mobile Hero Preview"
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            {/* Storefront Mini Browser Frame */}
            <div className="rounded-2xl border border-ink/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-[#202020] flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 border-b border-ink/5 pb-2.5 mb-3 px-1 dark:border-white/5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="ml-2 text-[10px] font-mono text-clay/70 dark:text-white/40 truncate">
                  luxeva.com/{previewDevice === "desktop" ? "hero-desktop" : "hero-mobile"}
                </span>
              </div>

              {/* Hero simulation content */}
              <div className="space-y-3">
                {previewDevice === "desktop" ? (
                  /* Desktop Hero Preview */
                  <div className="grid grid-cols-[1fr_1.1fr] gap-3 items-center p-2 rounded-xl bg-sand/40 dark:bg-white/[0.02]">
                    {/* Left text */}
                    <div className="space-y-1.5 pl-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-clay dark:text-white/50">
                        {bannerData?.subtitle || "Featured collection"}
                      </span>
                      <h4 className="font-serif text-xs font-semibold leading-tight text-ink dark:text-white line-clamp-2">
                        {bannerData?.title || "Fine things, effortlessly found."}
                      </h4>
                      <p className="text-[9px] text-clay dark:text-white/60 line-clamp-2 leading-relaxed">
                        {bannerData?.description || "A curated collection of premium essentials."}
                      </p>
                      <div className="pt-1 flex gap-1">
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[8px] font-semibold text-white dark:bg-white dark:text-ink">
                          {bannerData?.ctaLabel || "Shop now"}
                        </span>
                      </div>
                    </div>

                    {/* Right: The 4:5 hero image card */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-800 shadow-md">
                      {/* CSS-based exact crop simulation */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          width: "100%",
                          height: "100%"
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt="Hero Crop Preview"
                          className="absolute pointer-events-none"
                          style={{
                            maxWidth: "none",
                            maxHeight: "none",
                            width: `${(1 / (crop.width || 0.8)) * 100}%`,
                            height: `${(1 / (crop.height || 0.9)) * 100}%`,
                            left: `${-((crop.x || 0) / (crop.width || 0.8)) * 100}%`,
                            top: `${-((crop.y || 0) / (crop.height || 0.9)) * 100}%`
                          }}
                        />
                      </div>

                      {/* Floating Card at bottom */}
                      <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-white/20 bg-white/60 p-2 shadow-sm backdrop-blur-md dark:bg-black/60 dark:border-white/10">
                        <p className="text-[7px] font-semibold uppercase tracking-wider text-clay dark:text-white/60">
                          {bannerData?.subtitle || "Editor's pick"}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="text-[9px] font-semibold truncate text-ink dark:text-white">
                            {bannerData?.title || "Limited seasonal edit"}
                          </p>
                          <span className="rounded-full bg-ink px-1.5 py-0.2 text-[7px] font-semibold text-white dark:bg-white dark:text-ink shrink-0">
                            Shop
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mobile Hero Preview */
                  <div className="max-w-[240px] mx-auto space-y-2 p-2 rounded-xl bg-sand/40 dark:bg-white/[0.02]">
                    <div className="text-center space-y-1">
                      <span className="text-[8px] uppercase tracking-wider font-bold text-clay dark:text-white/50">
                        {bannerData?.subtitle || "Featured collection"}
                      </span>
                      <h4 className="font-serif text-xs font-semibold leading-tight text-ink dark:text-white">
                        {bannerData?.title || "Fine things, effortlessly found."}
                      </h4>
                    </div>

                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-800 shadow-md">
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: "100%", height: "100%" }}
                      >
                        <img
                          src={imageSrc}
                          alt="Hero Crop Preview"
                          className="absolute pointer-events-none"
                          style={{
                            maxWidth: "none",
                            maxHeight: "none",
                            width: `${(1 / (crop.width || 0.8)) * 100}%`,
                            height: `${(1 / (crop.height || 0.9)) * 100}%`,
                            left: `${-((crop.x || 0) / (crop.width || 0.8)) * 100}%`,
                            top: `${-((crop.y || 0) / (crop.height || 0.9)) * 100}%`
                          }}
                        />
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-white/20 bg-white/60 p-2 shadow-sm backdrop-blur-md dark:bg-black/60 dark:border-white/10">
                        <p className="text-[7px] font-semibold uppercase tracking-wider text-clay dark:text-white/60">
                          {bannerData?.subtitle || "Editor's pick"}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="text-[8px] font-semibold truncate text-ink dark:text-white">
                            {bannerData?.title || "Limited seasonal edit"}
                          </p>
                          <span className="rounded-full bg-ink px-1.5 py-0.2 text-[7px] font-semibold text-white dark:bg-white dark:text-ink shrink-0">
                            Shop
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Helpful Explanation */}
                <div className="rounded-xl border border-ink/5 bg-sand/30 p-3 text-[11px] text-clay dark:border-white/5 dark:bg-white/5 dark:text-white/70 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-white">
                    <AlertCircle size={13} className="text-amber-500" />
                    <span>Framing Recommendation</span>
                  </div>
                  <p className="leading-relaxed">
                    Luxeva hero banners display in a <strong>4:5 portrait frame</strong>. Keep important subjects
                    and faces in the center/upper half so they remain unobstructed by the floating card.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-ink/5 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#1a1a1a]">
          <div className="flex items-center gap-2 text-xs text-clay dark:text-white/60">
            <span>Aspect: <strong>{selectedAspect.label}</strong></span>
            <span>·</span>
            <span>Est. Quality: <strong>High ({cropPixW} × {cropPixH} px)</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-ghost text-xs px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={saving || !imageLoaded}
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
            >
              <Check size={14} />
              {saving ? "Processing & Uploading…" : "Apply & Save Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerCropModal;
