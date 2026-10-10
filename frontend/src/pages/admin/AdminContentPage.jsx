import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ImageIcon, Plus, Trash2, Pencil, X } from "lucide-react";
import api, { endpoints } from "../../services/api";
import ImagePicker from "../../components/admin/ImagePicker";

const initialBanner = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  ctaLabel: "",
  ctaLink: "",
  theme: "sand"
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
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([
      api.get(endpoints.content.adminBanners),
      api.get(endpoints.content.adminBlocks)
    ]).then(([bannerRes, blockRes]) => {
      setBanners(bannerRes.data.banners || []);
      setBlocks(blockRes.data.blocks || []);
    });

  useEffect(() => { load(); }, []);

  const setBf = (field, value) => setBannerForm((s) => ({ ...s, [field]: value }));

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBannerId) {
        await api.put(`${endpoints.content.adminBanners}/${editingBannerId}`, bannerForm);
        toast.success("Banner updated");
      } else {
        await api.post(endpoints.content.adminBanners, bannerForm);
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
    setBannerForm({ ...banner });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Content Manager</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-ink/5 dark:border-white/12">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
        <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
          {/* Banner form */}
          <form onSubmit={handleBannerSubmit} className="space-y-5 rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/5 dark:bg-[#222222]">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{editingBannerId ? "Edit banner" : "New banner"}</p>
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
              <textarea value={bannerForm.description} onChange={(e) => setBf("description", e.target.value)} rows={3} placeholder="Supporting body copy" className="input rounded-2xl resize-none" />
            </Field>
            <Field label="CTA label">
              <input value={bannerForm.ctaLabel} onChange={(e) => setBf("ctaLabel", e.target.value)} placeholder="e.g. Shop the collection" className="input" />
            </Field>
            <Field label="CTA link">
              <input value={bannerForm.ctaLink} onChange={(e) => setBf("ctaLink", e.target.value)} placeholder="/shop" className="input" />
            </Field>
            <Field label="Theme">
              <select value={bannerForm.theme} onChange={(e) => setBf("theme", e.target.value)} className="input">
                <option value="sand">Sand</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </Field>

            {/* Image picker */}
            <Field label="Banner image">
              <div className="space-y-3">
                {bannerForm.image ? (
                  <div className="relative group overflow-hidden rounded-2xl bg-sand dark:bg-white/5 aspect-[16/7]">
                    <img src={bannerForm.image} alt="Banner" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="btn-ghost bg-white/90 text-ink text-xs px-4 py-2"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setBf("image", "")}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/10 py-8 text-sm font-medium text-clay transition hover:border-ink/30 hover:text-ink dark:border-white/10 dark:text-white/65 dark:hover:border-white/30 dark:hover:text-white"
                  >
                    <ImageIcon size={24} className="opacity-50" />
                    Click to add banner image
                  </button>
                )}
              </div>
            </Field>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3.5">
              {saving ? "Saving…" : editingBannerId ? "Update banner" : "Create banner"}
            </button>
          </form>

          {/* Banner list */}
          <div className="space-y-4">
            <p className="text-sm text-clay dark:text-white/65">{banners.length} banner{banners.length !== 1 ? "s" : ""}</p>
            {banners.map((banner) => (
              <div key={banner._id} className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card dark:border-white/5 dark:bg-[#222222]">
                {banner.image && (
                  <div className="h-36 w-full overflow-hidden bg-sand dark:bg-white/8">
                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{banner.title}</p>
                    {banner.subtitle && <p className="text-xs text-clay dark:text-white/65 mt-0.5 truncate">{banner.subtitle}</p>}
                    {banner.ctaLink && (
                      <p className="text-xs text-clay dark:text-white/30 mt-0.5 font-mono">{banner.ctaLink}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditBanner(banner)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner._id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20"
                    >
                      <Trash2 size={14} />
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
        <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
          <div className="space-y-5 rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/5 dark:bg-[#222222]">
            <p className="font-semibold">Edit content block</p>
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
                rows={10}
                placeholder={'[\n  {"question":"...", "answer":"..."}\n]'}
                className="input rounded-2xl resize-none font-mono text-xs"
              />
            </Field>
            <button type="button" onClick={handleBlockSave} className="btn-primary w-full justify-center py-3.5">
              Save block
            </button>
          </div>

          {/* Blocks list */}
          <div className="space-y-4">
            <p className="text-sm text-clay dark:text-white/65">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</p>
            {blocks.map((block) => (
              <div
                key={block._id}
                onClick={() => setBlockForm({ key: block.key, title: block.title, subtitle: block.subtitle || "", items: JSON.stringify(block.items || [], null, 2) })}
                className="cursor-pointer rounded-2xl border border-ink/5 bg-white p-5 shadow-card transition hover:border-ink/15 dark:border-white/5 dark:bg-white/4 dark:hover:border-white/15"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-sand px-3 py-1.5 font-mono text-xs font-semibold dark:bg-white/10">{block.key}</span>
                  <span className="text-xs text-clay dark:text-white/65">{block.items?.length || 0} items</span>
                </div>
                {block.title && <p className="mt-3 font-semibold text-sm">{block.title}</p>}
                {block.subtitle && <p className="text-xs text-clay dark:text-white/65 mt-0.5">{block.subtitle}</p>}
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
          setBf("image", img?.url || img);
        }}
        multiple={false}
      />
    </div>
  );
};

export default AdminContentPage;
