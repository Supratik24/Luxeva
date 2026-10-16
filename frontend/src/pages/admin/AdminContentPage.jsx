import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  ImageIcon,
  Plus,
  Trash2,
  Pencil,
  X,
  Star,
  Crop,
  Sparkles,
  AlertCircle,
  Eye,
  Upload,
  Mail,
  Send,
  Users,
  Search,
  Megaphone,
  Check,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import api, { endpoints } from "../../services/api";
import { shortDate } from "../../utils/format";
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

const TABS = ["Banners", "Content Blocks", "Newsletter & Audience"];

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

  // Newsletter & Audience State
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    title: "",
    message: "",
    category: "private_drop",
    actionUrl: "/shop",
    actionText: "Explore Collection"
  });

  const load = () =>
    Promise.allSettled([
      api.get(endpoints.content.adminBanners),
      api.get(endpoints.content.adminBlocks),
      api.get(endpoints.content.adminSubscribers),
      api.get(endpoints.content.adminCampaigns)
    ]).then(([bannerRes, blockRes, subRes, campRes]) => {
      if (bannerRes.status === "fulfilled") {
        const fetchedBanners = (bannerRes.value?.data?.banners || []).sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );
        setBanners(fetchedBanners);
      }
      if (blockRes.status === "fulfilled") {
        setBlocks(blockRes.value?.data?.blocks || []);
      }
      if (subRes.status === "fulfilled") {
        const subs = subRes.value?.data?.data?.subscribers || subRes.value?.data?.subscribers || [];
        setSubscribers(subs);
      }
      if (campRes.status === "fulfilled") {
        const camps = campRes.value?.data?.data?.campaigns || campRes.value?.data?.campaigns || [];
        setCampaigns(camps);
      }
    });

  const activeSubscribersCount = useMemo(() => {
    return subscribers.filter((s) => s.status === "subscribed").length;
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    if (!subscriberSearch.trim()) return subscribers;
    const term = subscriberSearch.toLowerCase();
    return subscribers.filter((s) => s.email?.toLowerCase().includes(term));
  }, [subscribers, subscriberSearch]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.subject.trim() || !broadcastForm.message.trim()) {
      toast.error("Subject and campaign message are required.");
      return;
    }

    setSendingBroadcast(true);
    try {
      const res = await api.post(endpoints.content.adminSendCampaign, broadcastForm);
      const data = res.data?.data || res.data || {};
      toast.success(res.data?.message || `Broadcast sent to ${data.recipientCount || subscribers.length} subscribers!`);
      setBroadcastModalOpen(false);
      setBroadcastForm({
        subject: "",
        title: "",
        message: "",
        category: "private_drop",
        actionUrl: "/shop",
        actionText: "Explore Collection"
      });
      const campsRes = await api.get(endpoints.content.adminCampaigns);
      const updatedCamps = campsRes.data?.data?.campaigns || campsRes.data?.campaigns || [];
      setCampaigns(updatedCamps);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the subscribers list?`)) return;
    try {
      await api.delete(endpoints.content.adminDeleteSubscriber(id));
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
      toast.success(`Removed ${email}`);
    } catch (err) {
      toast.error("Failed to remove subscriber");
    }
  };

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

      {/* ── Newsletter & Audience ── */}
      {tab === "Newsletter & Audience" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/5 dark:bg-[#222222]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-white dark:bg-white dark:text-ink">
                    <Mail size={14} />
                  </span>
                  <h2 className="text-base font-semibold text-ink dark:text-white">
                    Newsletter Audience & Broadcasts
                  </h2>
                </div>
                <p className="mt-1 text-xs text-clay dark:text-white/50">
                  Subscribers captured via the storefront newsletter subscription form
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {activeSubscribersCount} Active Subscribers
                </span>
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(true)}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  <Send size={13} />
                  Compose Broadcast
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              {/* Left Column: Subscribers Roster (7 cols) */}
              <div className="lg:col-span-7 flex flex-col rounded-2xl border border-ink/8 bg-sand/30 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-clay dark:text-white/50" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-white">
                      Subscriber Roster ({filteredSubscribers.length})
                    </h3>
                  </div>
                  <div className="relative w-48 sm:w-56">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay dark:text-white/40" />
                    <input
                      type="text"
                      placeholder="Search email..."
                      value={subscriberSearch}
                      onChange={(e) => setSubscriberSearch(e.target.value)}
                      className="w-full rounded-full border border-ink/10 bg-white py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-clay outline-none transition focus:border-ink/30 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-white/40"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
                  {filteredSubscribers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-clay dark:text-white/40">
                      {subscriberSearch
                        ? "No subscribers match your search."
                        : "No newsletter subscribers yet. Subscriptions made on the storefront will appear here."}
                    </div>
                  ) : (
                    <div className="divide-y divide-ink/5 dark:divide-white/5">
                      {filteredSubscribers.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between py-2.5 px-1 text-xs transition hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 font-semibold text-[11px] text-ink dark:bg-white/10 dark:text-white">
                              {sub.email?.[0]?.toUpperCase() || "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink dark:text-white truncate">{sub.email}</p>
                              <p className="text-[10px] text-clay dark:text-white/45">
                                Subscribed {sub.subscribedAt ? shortDate(sub.subscribedAt) : "Recently"} ·{" "}
                                {sub.source || "storefront"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                sub.status === "subscribed"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-ink/5 text-clay dark:bg-white/10 dark:text-white/50"
                              }`}
                            >
                              {sub.status || "active"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubscriber(sub._id, sub.email)}
                              title="Remove subscriber"
                              className="rounded-lg p-1 text-clay hover:bg-rose-500/10 hover:text-rose-600 transition dark:text-white/40 dark:hover:text-rose-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Campaign Broadcasts History (5 cols) */}
              <div className="lg:col-span-5 flex flex-col rounded-2xl border border-ink/8 bg-sand/30 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="text-clay dark:text-white/50" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink dark:text-white">
                      Broadcast History ({campaigns.length})
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {campaigns.length === 0 ? (
                    <div className="py-12 text-center text-xs text-clay dark:text-white/40">
                      No campaigns broadcasted yet. Click "Compose Broadcast" to send a drop announcement or
                      newsletter to your subscribers.
                    </div>
                  ) : (
                    campaigns.map((camp) => (
                      <div
                        key={camp._id}
                        className="rounded-xl border border-ink/5 bg-white p-3.5 shadow-sm transition hover:border-ink/15 dark:border-white/5 dark:bg-[#1f1f1f] dark:hover:border-white/15"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-clay dark:bg-white/8 dark:text-white/60">
                            {camp.category?.replace("_", " ") || "announcement"}
                          </span>
                          <span className="text-[10px] text-clay dark:text-white/45">
                            {camp.sentAt ? shortDate(camp.sentAt) : "Just now"}
                          </span>
                        </div>
                        <h4 className="mt-1.5 font-semibold text-xs text-ink dark:text-white line-clamp-1">
                          {camp.subject}
                        </h4>
                        <p className="mt-1 text-[11px] text-clay dark:text-white/65 line-clamp-2 leading-relaxed">
                          {camp.message}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-ink/5 dark:border-white/5 text-[10px] text-clay dark:text-white/50">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Check size={11} /> Sent to {camp.recipientCount || subscribers.length} subscribers
                          </span>
                          {camp.actionUrl && (
                            <span className="font-mono text-clay/80 dark:text-white/40">
                              {camp.actionUrl}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Composer Modal in AdminContentPage */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-ink/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1c1c1c] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-ink/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink dark:text-white">Broadcast to Subscribers</h3>
                  <p className="text-xs text-clay dark:text-white/50">
                    Dispatch an editorial update, private drop, or announcement to {activeSubscribersCount} active subscribers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="rounded-full p-1.5 text-clay hover:bg-ink/5 dark:text-white/60 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Campaign Category
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { key: "private_drop", label: "Private Drop" },
                    { key: "weekly_edit", label: "Weekly Edit" },
                    { key: "flash_sale", label: "Flash Sale" },
                    { key: "announcement", label: "Announcement" }
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setBroadcastForm((f) => ({ ...f, category: cat.key }))}
                      className={`rounded-xl py-2 px-2.5 text-xs font-medium text-center transition border ${
                        broadcastForm.category === cat.key
                          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                          : "border-ink/10 bg-sand/30 text-clay hover:border-ink/30 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Private Access: Autumn Silk Collection is Live"
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Header / Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Handcrafted Autumn Edit"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                  Campaign Content / Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the newsletter message, launch details, promo highlights..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))}
                  className="input rounded-2xl resize-none py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Now"
                    value={broadcastForm.actionText}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, actionText: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-clay dark:text-white/60 mb-1.5">
                    Target Destination URL
                  </label>
                  <input
                    type="text"
                    placeholder="/shop"
                    value={broadcastForm.actionUrl}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, actionUrl: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Preview card */}
              <div className="rounded-2xl border border-dashed border-ink/15 bg-sand/30 p-3.5 dark:border-white/15 dark:bg-white/[0.02]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-clay dark:text-white/40 mb-1.5">
                  Subscriber Broadcast Preview
                </p>
                <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#222222]">
                  <p className="text-xs font-bold text-ink dark:text-white">
                    {broadcastForm.subject || "Subject line preview..."}
                  </p>
                  <p className="mt-1 text-xs text-clay dark:text-white/60 whitespace-pre-wrap">
                    {broadcastForm.message || "Your campaign message content will display here to subscribers."}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-ink/5 flex justify-end dark:border-white/5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white dark:bg-white dark:text-ink">
                      {broadcastForm.actionText || "Explore"}
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="btn-ghost py-2.5 px-5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="btn-primary py-2.5 px-6 text-xs"
                >
                  {sendingBroadcast ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Dispatching to {activeSubscribersCount} Subscribers...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Send Broadcast ({activeSubscribersCount} recipients)
                    </>
                  )}
                </button>
              </div>
            </form>
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
