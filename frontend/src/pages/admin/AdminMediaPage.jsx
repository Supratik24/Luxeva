import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, RefreshCw, Trash2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";
import ImagePicker from "../../components/admin/ImagePicker";

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminMediaPage = () => {
  const [resources, setResources] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [folder, setFolder] = useState("luxeva");

  const load = useCallback(async (cursor = null, newFolder = folder) => {
    cursor ? setLoadingMore(true) : setLoading(true);
    try {
      const params = { max_results: 30, folder: newFolder };
      if (cursor) params.next_cursor = cursor;
      const { data } = await api.get(endpoints.catalog.adminMedia, { params });
      const items = data.resources || [];
      setResources((prev) => cursor ? [...prev, ...items] : items);
      setNextCursor(data.nextCursor || null);
      setTotalCount(data.totalCount || items.length);
    } catch {
      toast.error("Could not load media");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [folder]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (resource) => {
    if (!window.confirm(`Delete "${resource.publicId}"?\nThis is permanent and cannot be undone.`)) return;
    setDeleting(resource.publicId);
    try {
      await api.delete(endpoints.catalog.adminMediaDelete(resource.publicId));
      setResources((prev) => prev.filter((r) => r.publicId !== resource.publicId));
      setTotalCount((prev) => prev - 1);
      if (selected?.publicId === resource.publicId) setSelected(null);
      toast.success("Image deleted from Cloudinary");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }, [selected]);

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => toast.success("URL copied!"));
  };

  const handleFolderChange = (newFolder) => {
    setFolder(newFolder);
    setResources([]);
    setNextCursor(null);
    load(null, newFolder);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow">Cloudinary</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Media Library</h1>
          {!loading && (
            <p className="text-sm text-clay dark:text-white/40 mt-1">
              {totalCount} image{totalCount !== 1 ? "s" : ""} in <code className="text-xs">{folder}/</code>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="btn-ghost text-sm px-4 py-2.5"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn-primary text-sm px-4 py-2.5"
          >
            <ImageIcon size={15} />
            Upload images
          </button>
        </div>
      </div>

      {/* Folder filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["luxeva", "luxeva/products", "luxeva/banners", "luxeva/brands"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => handleFolderChange(f)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              folder === f
                ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                : "border-ink/10 hover:border-ink/30 dark:border-white/10 dark:hover:border-white/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-clay dark:text-white/40" />
        </div>
      ) : resources.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ink/10 dark:border-white/10">
          <ImageIcon size={36} className="text-clay dark:text-white/20" />
          <div className="text-center">
            <p className="text-sm font-semibold">No images found</p>
            <p className="text-xs text-clay dark:text-white/40 mt-1">Upload images using the button above</p>
          </div>
          <button type="button" onClick={() => setPickerOpen(true)} className="btn-primary text-sm px-5 py-2.5">
            Upload now
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {resources.map((r) => (
              <div
                key={r.publicId}
                onClick={() => setSelected(selected?.publicId === r.publicId ? null : r)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                  selected?.publicId === r.publicId
                    ? "border-ink dark:border-white"
                    : "border-transparent hover:border-ink/15 dark:hover:border-white/15"
                } bg-sand dark:bg-white/5`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={r.url}
                    alt={r.publicId}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); copyUrl(r.url); }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white transition"
                      title="Copy URL"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white transition"
                      title="Delete"
                    >
                      {deleting === r.publicId ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Trash2 size={11} />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] font-medium text-white truncate px-1">
                    {r.publicId.split("/").pop()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => load(nextCursor)}
                disabled={loadingMore}
                className="btn-ghost px-8 py-3 text-sm"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Selected image detail panel */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/5 bg-white/95 backdrop-blur-xl p-4 dark:border-white/5 dark:bg-[#111]/95 lg:left-[310px]">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4">
            <img src={selected.url} alt={selected.publicId} className="h-14 w-14 rounded-xl object-cover shrink-0 ring-2 ring-ink/10 dark:ring-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{selected.publicId}</p>
              <p className="text-xs text-clay dark:text-white/40 mt-0.5">
                {selected.width}×{selected.height} · {formatBytes(selected.bytes)} · {selected.format?.toUpperCase()} · {new Date(selected.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-clay dark:text-white/30 truncate mt-0.5 font-mono">{selected.url}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyUrl(selected.url)}
                className="btn-ghost text-xs px-4 py-2.5"
              >
                <Copy size={13} />
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5 dark:hover:bg-white/5"
              >
                <Trash2 size={14} className="rotate-45 opacity-40" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload picker modal */}
      <ImagePicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); load(); }}
        onSelect={(file) => {
          toast.success("Image ready — check the grid");
          setPickerOpen(false);
          load();
        }}
        multiple
      />
    </div>
  );
};

export default AdminMediaPage;
