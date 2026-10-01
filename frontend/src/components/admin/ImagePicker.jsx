import { useCallback, useEffect, useRef, useState } from "react";
import { X, Upload, Image as ImageIcon, Check, Loader2, Trash2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Upload Tab ──────────────────────────────────────────────────────────────
const UploadTab = ({ onInsert, multiple }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef();

  const upload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const { data } = await api.post(endpoints.catalog.uploadImages, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResults((prev) => [...(data.files || []), ...prev]);
      toast.success(`${data.files?.length || 0} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      upload(e.dataTransfer.files);
    },
    [upload]
  );

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging
            ? "border-ink bg-ink/5 dark:border-white dark:bg-white/5"
            : "border-ink/15 hover:border-ink/30 dark:border-white/15 dark:hover:border-white/30"
        }`}
      >
        {uploading ? (
          <Loader2 size={28} className="animate-spin text-clay" />
        ) : (
          <Upload size={28} className="text-clay dark:text-white/40" />
        )}
        <div>
          <p className="font-semibold text-sm">
            {uploading ? "Uploading…" : "Drop images here or click to browse"}
          </p>
          <p className="text-xs text-clay dark:text-white/40 mt-1">PNG, JPG, WEBP — up to 8 files</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-clay dark:text-white/40 mb-3">
            Uploaded — click to insert
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {results.map((file) => (
              <button
                key={file.url}
                type="button"
                onClick={() => onInsert(file)}
                className="group relative overflow-hidden rounded-xl border border-ink/5 bg-sand dark:border-white/5 dark:bg-white/5 aspect-square"
              >
                <img src={file.url} alt={file.alt} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Check size={20} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Library Tab ─────────────────────────────────────────────────────────────
const LibraryTab = ({ onInsert, onDelete }) => {
  const [resources, setResources] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async (cursor = null) => {
    cursor ? setLoadingMore(true) : setLoading(true);
    try {
      const params = { max_results: 30 };
      if (cursor) params.next_cursor = cursor;
      const { data } = await api.get(endpoints.catalog.adminMedia, { params });
      setResources((prev) => cursor ? [...prev, ...(data.resources || [])] : (data.resources || []));
      setNextCursor(data.nextCursor || null);
    } catch {
      toast.error("Could not load media library");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (resource) => {
    if (!window.confirm(`Delete "${resource.publicId}"? This cannot be undone.`)) return;
    setDeleting(resource.publicId);
    try {
      await api.delete(endpoints.catalog.adminMediaDelete(resource.publicId));
      setResources((prev) => prev.filter((r) => r.publicId !== resource.publicId));
      if (selected?.publicId === resource.publicId) setSelected(null);
      toast.success("Image deleted");
      onDelete?.();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }, [selected, onDelete]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-clay" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-clay dark:text-white/40">
        <ImageIcon size={36} className="opacity-30" />
        <p className="text-sm">No images yet — upload some first</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {resources.map((r) => (
          <div
            key={r.publicId}
            className={`group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all ${
              selected?.publicId === r.publicId
                ? "border-ink dark:border-white"
                : "border-transparent hover:border-ink/20 dark:hover:border-white/20"
            } bg-sand dark:bg-white/5 aspect-square`}
            onClick={() => setSelected(r)}
          >
            <img src={r.url} alt={r.publicId} className="h-full w-full object-cover" />
            {selected?.publicId === r.publicId && (
              <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink dark:bg-white">
                <Check size={11} className="text-white dark:text-ink" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
              className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 hover:text-white dark:bg-black/60"
            >
              {deleting === r.publicId ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Trash2 size={10} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-sand/50 p-4 dark:border-white/5 dark:bg-white/5">
          <img src={selected.url} alt={selected.publicId} className="h-16 w-16 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{selected.publicId}</p>
            <p className="text-xs text-clay dark:text-white/40 mt-0.5">
              {selected.width}×{selected.height} · {formatBytes(selected.bytes)} · {selected.format?.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onInsert({ url: selected.url, alt: selected.publicId })}
            className="btn-primary shrink-0 text-xs px-4 py-2.5"
          >
            Insert
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <button
          type="button"
          onClick={() => load(nextCursor)}
          disabled={loadingMore}
          className="btn-ghost w-full py-3 text-sm"
        >
          {loadingMore ? <Loader2 size={16} className="animate-spin" /> : "Load more"}
        </button>
      )}
    </div>
  );
};

// ─── Main ImagePicker Component ───────────────────────────────────────────────
/**
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is shown
 * @param {function} props.onClose - Called when modal closes
 * @param {function} props.onSelect - Called with [{url, alt}] array on insertion
 * @param {boolean} [props.multiple=true] - Allow selecting multiple images
 */
const ImagePicker = ({ open, onClose, onSelect, multiple = true }) => {
  const [tab, setTab] = useState("upload");

  const handleInsert = useCallback((file) => {
    onSelect(multiple ? [file] : file);
    onClose();
  }, [onSelect, onClose, multiple]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-float dark:bg-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/5 px-6 py-4 dark:border-white/5">
          <div>
            <h2 className="text-base font-semibold">Media Library</h2>
            <p className="text-xs text-clay dark:text-white/40 mt-0.5">Upload or choose from your Cloudinary library</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-ink/5 px-6 dark:border-white/5">
          {[
            { id: "upload", label: "Upload new" },
            { id: "library", label: "Library" }
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === id
                  ? "border-ink text-ink dark:border-white dark:text-white"
                  : "border-transparent text-clay hover:text-ink dark:text-white/40 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "upload" ? (
            <UploadTab onInsert={handleInsert} multiple={multiple} />
          ) : (
            <LibraryTab onInsert={handleInsert} onDelete={() => {}} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePicker;
