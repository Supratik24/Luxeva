import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Plus, Trash2, Pencil, X, Star, Crop, Sparkles, AlertCircle, Eye, Upload } from "lucide-react";
import api, { endpoints } from "../../services/api";
import ImagePicker from "../../components/admin/ImagePicker";
import BannerCropModal from "../../components/admin/BannerCropModal";

const initialBanner = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  ctaLabel: "",
  ctaLink: "",
  theme: "sand",
  order: 1,
  active: true
};

const initialBlock = { key: "faq", title: "", subtitle: "", items: "[]" };

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-clay dark:text-white/65">{label}</label>
    {children}
  </div>
);

const TABS = ["Banners", "Content Blocks"];

const AdminContentPage = () => {
  const [banners, setBanners] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [bannerForm, setBannerForm] = useState(initialBanner);
  const [blockForm, setBlockForm] = useState(initialBlock);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [tab, setTab] = useState("Banners");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState("storefront"); // "storefront" (4:5) | "full"
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const load = () =>
    Promise.all([
      api.get(endpoints.content.adminBanners),
      api.get(endpoints.content.adminBlocks)
    ]).then(([bannerRes, blockRes]) => {
      // Sort banners by order
      const fetchedBanners = (bannerRes.data.banners || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      setBanners(fetchedBanners);
      setBlocks(blockRes.data.blocks || []);
    });

  useEffect(() => { load(); }, []);

  const setBf = (field, value) => setBannerForm((s) => ({ ...s, [field]: value }));

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...bannerForm,
        order: Number(bannerForm.order) || 1,
        active: bannerForm.active !== false
      };

      if (editingBannerId) {
        await api.put(`${endpoints.content.adminBanners}/${editingBannerId}`, payload);
        toast.success("Banner updated");
      } else {
        await api.post(endpoints.content.adminBanners, payload);
        toast.success("Banner created");
      }
      setBannerForm(initialBanner);
      setEditingBannerId(null);
      await load();
    } catch {
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleMakePrimary = async (targetBanner) => {
    try {
      // Set this banner to order 1, and shift all other banners up by 1
      await api.put(`${endpoints.content.adminBanners}/${targetBanner._id}`, {
        ...targetBanner,
        order: 1,
        active: true
      });

      const others = banners.filter((b) => b._id !== targetBanner._id);
      for (let i = 0; i < others.length; i++) {
        await api.put(`${endpoints.content.adminBanners}/${others[i]._id}`, {
          ...others[i],
          order: i + 2
        });
      }

      toast.success(`"${targetBanner.title}" is now the primary banner!`);
      await load();
    } catch {
      toast.error("Failed to update banner order");
    }
  };

  const handleBlockSave = async () => {
    try {
      const items = JSON.parse(blockForm.items || "[]");
      await api.put(endpoints.content.adminBlocks, {
        key: blockForm.key,
        title: blockForm.title,
        subtitle: blockForm.subtitle,
        items
      });
      toast.success("Content block saved");
      await load();
    } catch {
      toast.error("Invalid JSON in items field");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    await api.delete(`${endpoints.content.adminBanners}/${id}`);
    toast.success("Banner deleted");
    await load();
  };

  const startEditBanner = (banner) => {
    setEditingBannerId(banner._id);
    setBannerForm({
      ...banner,
      order: banner.order ?? 1,
      active: banner.active ?? true
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-semibold">Content Manager</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink/5 dark:border-white/12 overflow-x-auto pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors shrink-0 ${
              tab === t
                ? "border-ink text-ink dark:border-white dark:text-white"
                : "border-transparent text-clay hover:text-ink dark:text-white/65 dark:hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Banners ── */}
      {tab === "Banners" && (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)] min-w-0 items-start">
          {/* Banner form */}
          <form onSubmit={handleBannerSubmit} className="space-y-4 rounded-2xl border border-ink/5 bg-white p-5 sm:p-6 shadow-card dark:border-white/5 dark:bg-[#222222] min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm sm:text-base">{editingBannerId ? "Edit Banner" : "New Banner"}</p>
              {editingBannerId && (
                <button type="button" onClick={() => { setBannerForm(initialBanner); setEditingBannerId(null); }} className="text-xs text-clay hover:text-ink dark:text-white/65">
                  Cancel
                </button>
              )}
            </div>

            <Field label="Title *">
              <input value={bannerForm.title} onChange={(e) => setBf("title", e.target.value)} placeholder="Headline shown on hero" className="input" required />
            </Field>

            <Field label="Subtitle">
              <input value={bannerForm.subtitle} onChange={(e) => setBf("subtitle", e.target.value)} placeholder="Small label below hero image" className="input" />
            </Field>

            <Field label="Description">
              <textarea value={bannerForm.description} onChange={(e) => setBf("description", e.target.value)} rows={2} placeholder="Supporting body copy" className="input rounded-2xl resize-none" />
            </Field>

            {/* CTA Label & Link side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="CTA label">
                <input value={bannerForm.ctaLabel} onChange={(e) => setBf("ctaLabel", e.target.value)} placeholder="e.g. Shop collection" className="input" />
              </Field>
              <Field label="CTA link">
                <input value={bannerForm.ctaLink} onChange={(e) => setBf("ctaLink", e.target.value)} placeholder="/shop" className="input" />
              </Field>
            </div>

            {/* Order, Visibility & Theme in 3 columns */}
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Order">
                <input
                  type="number"
                  min="1"
                  value={bannerForm.order ?? 1}
                  onChange={(e) => setBf("order", Number(e.target.value))}
                  className="input px-2.5 text-center font-medium"
                />
              </Field>
              <Field label="Visibility">
                <select
                  value={bannerForm.active !== false ? "active" : "hidden"}
                  onChange={(e) => setBf("active", e.target.value === "active")}
                  className="input px-2 text-xs"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </Field>
              <Field label="Theme">
                <select value={bannerForm.theme} onChange={(e) => setBf("theme", e.target.value)} className="input px-2 text-xs">
                  <option value="sand">Sand</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </Field>
            </div>

            {/* Banner image & Storefront Viewport Preview */}
            <Field label="Banner Image (Hero Showcase)">
              <div className="space-y-2.5">
                {/* Hidden local file input for direct upload & crop */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const objectUrl = URL.createObjectURL(file);
                    setBf("image", objectUrl);
                    setCropModalOpen(true);
                  }}
                />

                {bannerForm.image ? (
                  <div className="space-y-2.5">
                    {/* View mode toggle */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-clay dark:text-white/65 flex items-center gap-1 text-[11px]">
                        <Sparkles size={11} className="text-amber-500" />
                        Viewport Preview
                      </span>
                      <div className="flex items-center rounded-lg bg-sand/60 dark:bg-white/5 p-0.5 border border-ink/5 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setPreviewMode("storefront")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                            previewMode === "storefront"
                              ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                              : "text-clay hover:text-ink dark:text-white/60"
                          }`}
                        >
                          Storefront (4:5)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode("full")}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                            previewMode === "full"
                              ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                              : "text-clay hover:text-ink dark:text-white/60"
                          }`}
                        >
                          Full Uncropped
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Container */}
                    <div className="relative group overflow-hidden rounded-2xl bg-stone-900 border border-ink/10 dark:border-white/10 shadow-md">
                      {previewMode === "storefront" ? (
                        /* Proportional 4:5 Storefront Hero aspect ratio */
                        <div className="relative h-[250px] aspect-[4/5] mx-auto overflow-hidden flex items-center justify-center">
                          <img
                            src={bannerForm.image}
                            alt="Banner"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                              4:5 Hero
                            </span>
                            <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                              ✓ Live Frame
                            </span>
                          </div>

                          {/* Floating Card Overlay */}
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-xl border border-white/20 bg-white/70 p-2.5 shadow-md backdrop-blur-md dark:bg-black/60 dark:border-white/15 pointer-events-none transition-transform duration-300 group-hover:-translate-y-0.5">
                            <p className="text-[8px] font-semibold uppercase tracking-wider text-clay dark:text-white/60 mb-0.5">
                              {bannerForm.subtitle || "Editor's pick"}
                            </p>
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="font-serif text-[11px] font-semibold truncate text-ink dark:text-white leading-tight">
                                {bannerForm.title || "Limited seasonal edit"}
                              </p>
                              <span className="rounded-full bg-ink px-1.5 py-0.2 text-[8px] font-semibold text-white dark:bg-white dark:text-ink shrink-0">
                                {bannerForm.ctaLabel || "Shop"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Full Uncropped view */
                        <div className="relative p-2 flex items-center justify-center bg-stone-950/80 h-[220px]">
                          <img
                            src={bannerForm.image}
                            alt="Banner Full"
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                      )}

                      {/* Action buttons bar */}
                      <div className="p-2.5 bg-white dark:bg-[#1e1e1e] border-t border-ink/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCropModalOpen(true)}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                        >
                          <Crop size={13} />
                          <span>Crop & Frame</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="btn-ghost text-xs py-1.5 px-2.5 border border-ink/10 dark:border-white/10"
                            title="Choose from library"
                          >
                            <ImageIcon size={12} />
                            <span>Library</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-ghost text-xs py-1.5 px-2.5 border border-ink/10 dark:border-white/10"
                            title="Upload fresh image file"
                          >
                            <Upload size={12} />
                            <span>Upload</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBf("image", "")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-500/20 transition"
                            title="Remove image"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Viewport Guidance Alert */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] dark:border-amber-400/20 dark:bg-amber-400/5 text-clay dark:text-white/70 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                        <AlertCircle size={13} />
                        <span>Storefront Hero: 4:5 Portrait Frame</span>
                      </div>
                      <p className="leading-relaxed">
                        Lower 22% is covered by the title card. Click <strong>Crop & Frame</strong> to keep faces/products in the safe upper zone.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Empty image state with options */
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/10 py-5 px-3 text-center transition hover:border-ink/30 hover:bg-sand/30 dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/5"
                    >
                      <ImageIcon size={20} className="text-clay dark:text-white/60" />
                      <span className="text-xs font-semibold text-ink dark:text-white">Media Library</span>
                      <span className="text-[10px] text-clay dark:text-white/50">Cloudinary</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink/10 py-5 px-3 text-center transition hover:border-ink/30 hover:bg-sand/30 dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/5"
                    >
                      <Upload size={20} className="text-clay dark:text-white/60" />
                      <span className="text-xs font-semibold text-ink dark:text-white">Upload & Crop</span>
                      <span className="text-[10px] text-clay dark:text-white/50">From device</span>
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 text-sm">
              {saving ? "Saving…" : editingBannerId ? "Update Banner" : "Create Banner"}
            </button>
          </form>

          {/* Banner list */}
          <div className="space-y-3.5 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-clay dark:text-white/65">
                Active Banners ({banners.length})
              </p>
              <span className="text-xs text-clay/60 dark:text-white/40">Slide order on storefront</span>
            </div>

            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card dark:border-white/5 dark:bg-[#222222] min-w-0"
              >
                {banner.image && (
                  <div className="h-28 sm:h-32 w-full overflow-hidden bg-sand dark:bg-white/8 relative">
                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                        index === 0
                          ? "bg-amber-400 text-black font-semibold"
                          : "bg-black/60 text-white backdrop-blur-sm"
                      }`}>
                        {index === 0 ? "★ Primary Slide" : `#${index + 1} (Order: ${banner.order ?? index + 1})`}
                      </span>
                      {banner.active === false && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white shadow-sm">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-sm text-ink dark:text-white">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="text-xs text-clay dark:text-white/60 mt-0.5 truncate">{banner.subtitle}</p>
                    )}
                    {banner.ctaLink && (
                      <p className="text-[11px] text-clay/60 dark:text-white/40 mt-0.5 font-mono truncate">{banner.ctaLink}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleMakePrimary(banner)}
                        title="Make this the first slide on the website"
                        className="flex h-8 items-center gap-1 px-2.5 text-xs font-semibold rounded-full border border-amber-400/50 text-amber-600 dark:text-amber-400 hover:bg-amber-400/10 transition"
                      >
                        <Star size={11} className="fill-current" />
                        <span className="hidden md:inline text-[11px]">Primary</span>
                      </button>
                    )}
                    {banner.image && (
                      <button
                        type="button"
                        onClick={() => {
                          startEditBanner(banner);
                          setCropModalOpen(true);
                        }}
                        title="Crop & reposition this banner image"
                        className="flex h-8 items-center gap-1 px-2.5 text-xs font-semibold rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/10 dark:hover:bg-white/5 text-[11px]"
                      >
                        <Crop size={12} />
                        <span>Crop</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditBanner(banner)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/10 dark:hover:bg-white/5"
                      title="Edit banner"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20"
                      title="Delete banner"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content Blocks ── */}
      {tab === "Content Blocks" && (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)] min-w-0 items-start">
          <div className="space-y-4 rounded-2xl border border-ink/5 bg-white p-5 sm:p-6 shadow-card dark:border-white/5 dark:bg-[#222222] min-w-0">
            <p className="font-semibold text-sm sm:text-base">Edit Content Block</p>
            <Field label="Block key">
              <select value={blockForm.key} onChange={(e) => setBlockForm((s) => ({ ...s, key: e.target.value }))} className="input">
                <option value="faq">faq</option>
                <option value="about">about</option>
                <option value="contact">contact</option>
                <option value="testimonials">testimonials</option>
              </select>
            </Field>
            <Field label="Title">
              <input value={blockForm.title} onChange={(e) => setBlockForm((s) => ({ ...s, title: e.target.value }))} placeholder="Section heading" className="input" />
            </Field>
            <Field label="Subtitle">
              <input value={blockForm.subtitle} onChange={(e) => setBlockForm((s) => ({ ...s, subtitle: e.target.value }))} placeholder="Section subheading" className="input" />
            </Field>
            <Field label='Items (JSON array)'>
              <textarea
                value={blockForm.items}
                onChange={(e) => setBlockForm((s) => ({ ...s, items: e.target.value }))}
                rows={8}
                placeholder={'[\n  {"question":"...", "answer":"..."}\n]'}
                className="input rounded-2xl resize-none font-mono text-xs"
              />
            </Field>
            <button type="button" onClick={handleBlockSave} className="btn-primary w-full justify-center py-3 text-sm">
              Save Block
            </button>
          </div>

          {/* Blocks list */}
          <div className="space-y-3.5 min-w-0">
            <p className="text-sm font-semibold text-clay dark:text-white/65">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</p>
            {blocks.map((block) => (
              <div
                key={block._id}
                onClick={() => setBlockForm({ key: block.key, title: block.title, subtitle: block.subtitle || "", items: JSON.stringify(block.items || [], null, 2) })}
                className="cursor-pointer rounded-2xl border border-ink/5 bg-white p-4 sm:p-5 shadow-card transition hover:border-ink/15 dark:border-white/5 dark:bg-[#222222] dark:hover:border-white/15 min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-sand px-2.5 py-1 font-mono text-xs font-semibold dark:bg-white/10 shrink-0">{block.key}</span>
                  <span className="text-xs text-clay dark:text-white/65 shrink-0">{block.items?.length || 0} items</span>
                </div>
                {block.title && <p className="mt-2.5 font-semibold text-sm truncate">{block.title}</p>}
                {block.subtitle && <p className="text-xs text-clay dark:text-white/65 mt-0.5 truncate">{block.subtitle}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ImagePicker modal — single select for banner image */}
      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(file) => {
          const img = Array.isArray(file) ? file[0] : file;
          const url = img?.url || img;
          setBf("image", url);
          // Automatically open crop editor so the admin immediately sees the crop frame!
          setCropModalOpen(true);
        }}
        multiple={false}
      />

      {/* Banner Crop & Reposition Modal with Live Storefront Preview */}
      <BannerCropModal
        open={cropModalOpen}
        imageSrc={bannerForm.image}
        onClose={() => setCropModalOpen(false)}
        onApply={(croppedUrl) => {
          setBf("image", croppedUrl);
        }}
        bannerData={{
          title: bannerForm.title,
          subtitle: bannerForm.subtitle,
          description: bannerForm.description,
          ctaLabel: bannerForm.ctaLabel
        }}
      />
    </div>
  );
};

export default AdminContentPage;
