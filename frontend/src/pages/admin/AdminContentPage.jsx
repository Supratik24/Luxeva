import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";

const AdminContentPage = () => {
  const [banners, setBanners] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [bannerForm, setBannerForm] = useState({ title: "", subtitle: "", description: "", image: "", ctaLabel: "", ctaLink: "", theme: "sand" });
  const [blockForm, setBlockForm] = useState({ key: "faq", title: "", subtitle: "", items: "[]" });

  const load = () =>
    Promise.all([api.get(endpoints.content.adminBanners), api.get(endpoints.content.adminBlocks)]).then(([bannerRes, blockRes]) => {
      setBanners(bannerRes.data.banners || []);
      setBlocks(blockRes.data.blocks || []);
    });

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <div className="rounded-[2rem] border border-ink/10 p-5 dark:border-white/10">
        <h1 className="font-display text-4xl">Banners</h1>
        <div className="mt-4 space-y-3">
          {Object.keys(bannerForm).map((field) => (
            <input key={field} value={bannerForm[field]} onChange={(e) => setBannerForm((s) => ({ ...s, [field]: e.target.value }))} placeholder={field} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          ))}
          <button type="button" onClick={async () => { await api.post(endpoints.content.adminBanners, bannerForm); setBannerForm({ title: "", subtitle: "", description: "", image: "", ctaLabel: "", ctaLink: "", theme: "sand" }); await load(); }} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
            Add banner
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {banners.map((banner) => (
            <div key={banner._id} className="rounded-[1.5rem] bg-ink/5 p-4 dark:bg-white/5">
              <p className="font-semibold">{banner.title}</p>
              <p className="text-sm text-ink/50 dark:text-white/50">{banner.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[2rem] border border-ink/10 p-5 dark:border-white/10">
        <h2 className="font-display text-4xl">Content blocks</h2>
        <div className="mt-4 space-y-3">
          {["key", "title", "subtitle"].map((field) => (
            <input key={field} value={blockForm[field]} onChange={(e) => setBlockForm((s) => ({ ...s, [field]: e.target.value }))} placeholder={field} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          ))}
          <textarea value={blockForm.items} onChange={(e) => setBlockForm((s) => ({ ...s, items: e.target.value }))} rows="8" placeholder='[{"question":"...","answer":"..."}]' className="w-full rounded-[1.5rem] border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <button
            type="button"
            onClick={async () => {
              await api.put(endpoints.content.adminBlocks, {
                key: blockForm.key,
                title: blockForm.title,
                subtitle: blockForm.subtitle,
                items: JSON.parse(blockForm.items || "[]")
              });
              await load();
            }}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Save block
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {blocks.map((block) => (
            <div key={block._id} className="rounded-[1.5rem] bg-ink/5 p-4 dark:bg-white/5">
              <p className="font-semibold">{block.key}</p>
              <p className="text-sm text-ink/50 dark:text-white/50">{block.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContentPage;

