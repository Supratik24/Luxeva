import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Tag, Package, Star, ChevronDown, X, ImageIcon, Check } from "lucide-react";
import api, { endpoints } from "../../services/api";
import ImagePicker from "../../components/admin/ImagePicker";

const initialProduct = {
  name: "",
  shortDescription: "",
  description: "",
  category: "",
  brand: "",
  price: 0,
  compareAtPrice: 0,
  sku: "",
  stock: 0,
  featured: false,
  trending: false,
  colors: "",
  sizes: "",
  tags: "",
  variants: "",
  images: []
};

const SECTIONS = ["Products", "Categories & Brands", "Coupons", "Reviews"];

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-clay dark:text-white/65">{label}</label>
    {children}
  </div>
);

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialProduct);
  const [editingId, setEditingId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [couponForm, setCouponForm] = useState({ code: "", type: "percentage", value: 10, minOrderAmount: 0 });
  const [activeSection, setActiveSection] = useState("Products");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Admin Review & Rating Controls state
  const [adminReviewForm, setAdminReviewForm] = useState({
    productId: "",
    rating: 5,
    userName: "Verified Customer",
    title: "",
    comment: "",
    status: "approved"
  });
  const [ratingOverrideForm, setRatingOverrideForm] = useState({
    productId: "",
    averageRating: 4.8,
    reviewCount: 12
  });
  const [reviewTabMode, setReviewTabMode] = useState("add"); // "add" | "override"
  const [reviewFilterProduct, setReviewFilterProduct] = useState("all");
  const [reviewFilterStatus, setReviewFilterStatus] = useState("all");
  const [reviewSearch, setReviewSearch] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  const load = () =>
    Promise.all([
      api.get(`${endpoints.catalog.products}?limit=1000`),
      api.get(endpoints.catalog.meta),
      api.get(endpoints.catalog.adminCoupons),
      api.get(endpoints.catalog.adminReviews)
    ]).then(([productsRes, metaRes, couponsRes, reviewsRes]) => {
      setProducts(productsRes.data.products || []);
      setMeta(metaRes.data);
      setCoupons(couponsRes.data.coupons || []);
      setReviews(reviewsRes.data.reviews || []);
    });

  useEffect(() => { load(); }, []);

  const set = (field, value) => setForm((s) => ({ ...s, [field]: value }));

  const handleCreateAdminReview = async (e) => {
    e?.preventDefault?.();
    if (!adminReviewForm.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!adminReviewForm.comment && !adminReviewForm.title) {
      toast.error("Please provide a review comment or title");
      return;
    }

    setSavingReview(true);
    try {
      await api.post(endpoints.catalog.adminReviews, adminReviewForm);
      toast.success("Review & rating published successfully!");
      setAdminReviewForm((prev) => ({
        ...prev,
        title: "",
        comment: "",
        rating: 5
      }));
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to publish review");
    } finally {
      setSavingReview(false);
    }
  };

  const handleSelectProductForOverride = (pId) => {
    const prod = products.find((p) => p._id === pId);
    setRatingOverrideForm({
      productId: pId,
      averageRating: prod?.averageRating !== undefined && prod.averageRating > 0 ? prod.averageRating : 4.8,
      reviewCount: prod?.reviewCount !== undefined && prod.reviewCount > 0 ? prod.reviewCount : 12
    });
  };

  const handleUpdateProductRating = async (e) => {
    e?.preventDefault?.();
    if (!ratingOverrideForm.productId) {
      toast.error("Please select a product");
      return;
    }

    setSavingRating(true);
    try {
      await api.patch(endpoints.catalog.adminProductRating(ratingOverrideForm.productId), {
        averageRating: Number(ratingOverrideForm.averageRating),
        reviewCount: Number(ratingOverrideForm.reviewCount)
      });
      toast.success("Product rating updated successfully!");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update product rating");
    } finally {
      setSavingRating(false);
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      await api.delete(endpoints.catalog.adminReview(id));
      toast.success("Review deleted and rating refreshed");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilterProduct !== "all") {
      const pId = String(r.product?._id || r.product);
      if (pId !== reviewFilterProduct) return false;
    }
    if (reviewFilterStatus !== "all" && r.status !== reviewFilterStatus) {
      return false;
    }
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchUser = r.userName?.toLowerCase().includes(q);
      const matchProd = r.product?.name?.toLowerCase().includes(q);
      if (!matchComment && !matchTitle && !matchUser && !matchProd) return false;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let parsedVariants = [];
    try {
      parsedVariants = form.variants ? JSON.parse(form.variants) : [];
    } catch (err) {
      toast.error("Variants must be valid JSON");
      return;
    }
    const payload = {
      ...form,
      colors: String(form.colors).split(",").map((s) => s.trim()).filter(Boolean),
      sizes: String(form.sizes).split(",").map((s) => s.trim()).filter(Boolean),
      tags: String(form.tags).split(",").map((s) => s.trim()).filter(Boolean),
      variants: parsedVariants
    };
    setSaving(true);
    try {
      if (editingId) await api.put(endpoints.catalog.adminProduct(editingId), payload);
      else await api.post(endpoints.catalog.adminProducts, payload);
      toast.success(editingId ? "Product updated" : "Product created");
      setForm(initialProduct);
      setEditingId(null);
      await load();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      ...product,
      colors: product.colors?.join(", ") || "",
      sizes: product.sizes?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      variants: product.variants?.length ? JSON.stringify(product.variants, null, 2) : ""
    });
    setActiveSection("Products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    await api.delete(endpoints.catalog.adminProduct(id));
    toast.success("Product deleted");
    await load();
  };

  const handleImageSelect = (files) => {
    const incoming = Array.isArray(files) ? files : [files];
    setForm((s) => ({ ...s, images: [...s.images, ...incoming] }));
    toast.success(`${incoming.length} image(s) added`);
  };

  const removeImage = (index) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== index) }));
  };

  const inputClass = "input";

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Products</h1>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 mb-8 border-b border-ink/5 dark:border-white/5 pb-0">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === s
                ? "border-ink text-ink dark:border-white dark:text-white"
                : "border-transparent text-clay hover:text-ink dark:text-white/65 dark:hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Products Section ── */}
      {activeSection === "Products" && (
        <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{editingId ? "Edit product" : "New product"}</p>
              {editingId && (
                <button type="button" onClick={() => { setForm(initialProduct); setEditingId(null); }} className="text-xs text-clay hover:text-ink dark:text-white/65">
                  Cancel edit
                </button>
              )}
            </div>

            <Field label="Product name *">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Premium Cotton Tee" className={inputClass} />
            </Field>
            <Field label="Short description">
              <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-liner shown on cards" className={inputClass} />
            </Field>
            <Field label="Full description">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Detailed product description…" className="input rounded-2xl resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputClass} min={0} />
              </Field>
              <Field label="Compare-at price (₹)">
                <input type="number" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} className={inputClass} min={0} />
              </Field>
              <Field label="SKU">
                <input required value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="LX-001" className={inputClass} />
              </Field>
              <Field label="Stock">
                <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={inputClass} min={0} />
              </Field>
            </div>

            <Field label="Category">
              <select required value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {meta.categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <select required value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputClass}>
                <option value="">Select brand</option>
                {meta.brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </Field>

            <Field label="Colors (comma-separated)">
              <input value={form.colors} onChange={(e) => set("colors", e.target.value)} placeholder="Black, White, Ivory" className={inputClass} />
            </Field>
            <Field label="Sizes (comma-separated)">
              <input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="XS, S, M, L, XL" className={inputClass} />
            </Field>
            <Field label="Tags (comma-separated)">
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="summer, casual, basics" className={inputClass} />
            </Field>

            <Field label='Variants JSON (optional) — e.g. [{"size":"M","color":"Black","sku":"LX-001-M","stock":5}]'>
              <textarea value={form.variants} onChange={(e) => set("variants", e.target.value)} rows={4} className="input rounded-2xl resize-none font-mono text-xs" />
            </Field>

            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="rounded" />
                Featured
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={form.trending} onChange={(e) => set("trending", e.target.checked)} className="rounded" />
                Trending
              </label>
            </div>

            {/* Images */}
            <Field label="Product images">
              <div className="space-y-3">
                {form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square overflow-hidden rounded-xl bg-sand dark:bg-white/5">
                        <img src={img.url || img} alt={img.alt || `Image ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        >
                          <X size={10} />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded-full bg-ink/70 px-1.5 py-0.5 text-[9px] font-bold text-white">Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/10 py-4 text-sm font-medium text-clay transition hover:border-ink/30 hover:text-ink dark:border-white/10 dark:text-white/65 dark:hover:border-white/30 dark:hover:text-white"
                >
                  <ImageIcon size={16} />
                  {form.images.length === 0 ? "Add images" : "Add more images"}
                </button>
              </div>
            </Field>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3.5">
              {saving ? "Saving…" : editingId ? "Update product" : "Create product"}
            </button>
          </form>

          {/* Product list */}
          <div className="space-y-3">
            <p className="text-sm text-clay dark:text-white/65">{products.length} products total</p>
            {products.map((product) => (
              <div key={product._id} className="flex items-center gap-4 rounded-2xl border border-ink/5 bg-white p-4 shadow-card dark:border-white/12 dark:bg-[#222222]">
                {/* Thumbnail */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand dark:bg-white/5">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon size={18} className="text-clay dark:text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{product.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-clay dark:text-white/65">SKU: {product.sku || "—"}</span>
                    {product.stock <= 0 ? (
                      <span className="badge bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                        Out of stock (0)
                      </span>
                    ) : product.stock <= 5 ? (
                      <span className="badge bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                        Low stock ({product.stock})
                      </span>
                    ) : (
                      <span className="text-xs text-clay dark:text-white/65">Stock: {product.stock}</span>
                    )}
                    <span className="text-xs text-clay dark:text-white/65">₹{product.price}</span>
                    {product.featured && <span className="badge bg-sand text-ink dark:bg-white/10 dark:text-white">Featured</span>}
                    {product.trending && <span className="badge bg-sand text-ink dark:bg-white/10 dark:text-white">Trending</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Categories & Brands Section ── */}
      {activeSection === "Categories & Brands" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <p className="font-semibold mb-4">Categories</p>
            <div className="flex gap-2 mb-5">
              <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="New category name" className="input" />
              <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminCategories, { name: categoryName }); setCategoryName(""); await load(); }} className="btn-primary shrink-0 px-4 py-2.5">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {meta.categories.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-xl border border-ink/5 px-4 py-3 dark:border-white/5">
                  <span className="text-sm font-medium">{item.name}</span>
                  <button type="button" onClick={async () => { await api.delete(endpoints.catalog.adminCategory(item._id)); await load(); }} className="text-red-400 hover:text-red-600 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <p className="font-semibold mb-4">Brands</p>
            <div className="flex gap-2 mb-5">
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="New brand name" className="input" />
              <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminBrands, { name: brandName }); setBrandName(""); await load(); }} className="btn-primary shrink-0 px-4 py-2.5">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {meta.brands.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-xl border border-ink/5 px-4 py-3 dark:border-white/5">
                  <span className="text-sm font-medium">{item.name}</span>
                  <button type="button" onClick={async () => { await api.delete(endpoints.catalog.adminBrand(item._id)); await load(); }} className="text-red-400 hover:text-red-600 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Coupons Section ── */}
      {activeSection === "Coupons" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <p className="font-semibold mb-5">Create coupon</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Code">
                <input value={couponForm.code} onChange={(e) => setCouponForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" className="input" />
              </Field>
              <Field label="Type">
                <select value={couponForm.type} onChange={(e) => setCouponForm((s) => ({ ...s, type: e.target.value }))} className="input">
                  <option value="percentage">Percentage %</option>
                  <option value="fixed">Fixed ₹</option>
                </select>
              </Field>
              <Field label="Value">
                <input type="number" value={couponForm.value} onChange={(e) => setCouponForm((s) => ({ ...s, value: Number(e.target.value) }))} className="input" min={0} />
              </Field>
              <Field label="Min order amount (₹)">
                <input type="number" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm((s) => ({ ...s, minOrderAmount: Number(e.target.value) }))} className="input" min={0} />
              </Field>
            </div>
            <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminCoupons, couponForm); setCouponForm({ code: "", type: "percentage", value: 10, minOrderAmount: 0 }); await load(); }} className="btn-primary mt-5">
              <Tag size={15} />
              Create coupon
            </button>
          </div>

          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon._id} className="flex items-center justify-between rounded-2xl border border-ink/5 bg-white px-5 py-4 shadow-card dark:border-white/12 dark:bg-[#222222]">
                <div className="flex items-center gap-4">
                  <span className="rounded-lg bg-sand px-3 py-1.5 font-mono text-sm font-bold dark:bg-white/10">{coupon.code}</span>
                  <div>
                    <p className="text-sm font-medium">{coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`}</p>
                    {coupon.minOrderAmount > 0 && <p className="text-xs text-clay dark:text-white/65">Min order ₹{coupon.minOrderAmount}</p>}
                  </div>
                </div>
                <button type="button" onClick={async () => { await api.delete(endpoints.catalog.adminCoupon(coupon._id)); await load(); }} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews Section ── */}
      {activeSection === "Reviews" && (
        <div className="grid gap-8 lg:grid-cols-[440px_1fr]">
          {/* Left Column: Admin Controls */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-card dark:border-white/12 dark:bg-[#222222]">
              <div className="flex items-center justify-between gap-2 border-b border-ink/5 pb-4 dark:border-white/10">
                <div className="flex gap-2 p-1 rounded-xl bg-sand/60 dark:bg-white/5 w-full">
                  <button
                    type="button"
                    onClick={() => setReviewTabMode("add")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      reviewTabMode === "add"
                        ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                        : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    Add Product Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewTabMode("override")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      reviewTabMode === "override"
                        ? "bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white"
                        : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    Set Product Rating
                  </button>
                </div>
              </div>

              {reviewTabMode === "add" ? (
                <form onSubmit={handleCreateAdminReview} className="mt-5 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Publish New Review & Rating</h3>
                    <p className="text-xs text-clay dark:text-white/65 mt-0.5">
                      Enter a customer or editorial rating for any specific product.
                    </p>
                  </div>

                  <Field label="Target Product">
                    <select
                      value={adminReviewForm.productId}
                      onChange={(e) => setAdminReviewForm((s) => ({ ...s, productId: e.target.value }))}
                      className="input"
                      required
                    >
                      <option value="">-- Select a product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.averageRating?.toFixed(1) || 0}★ · {p.reviewCount || 0} reviews)
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Rating">
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setAdminReviewForm((s) => ({ ...s, rating: starVal }))}
                            className="p-1 transition hover:scale-110"
                            title={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                          >
                            <Star
                              size={22}
                              className={
                                starVal <= adminReviewForm.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-ink/15 dark:text-white/15"
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-clay dark:text-white/65 ml-2">
                        {adminReviewForm.rating} of 5 Stars
                      </span>
                    </div>
                  </Field>

                  <Field label="Reviewer Name">
                    <input
                      type="text"
                      value={adminReviewForm.userName}
                      onChange={(e) => setAdminReviewForm((s) => ({ ...s, userName: e.target.value }))}
                      placeholder="e.g. Verified Buyer, Priya Sharma"
                      className="input"
                      required
                    />
                  </Field>

                  <Field label="Review Title (Optional)">
                    <input
                      type="text"
                      value={adminReviewForm.title}
                      onChange={(e) => setAdminReviewForm((s) => ({ ...s, title: e.target.value }))}
                      placeholder="e.g. Flawless silk finish and perfect fit"
                      className="input"
                    />
                  </Field>

                  <Field label="Review Comment">
                    <textarea
                      value={adminReviewForm.comment}
                      onChange={(e) => setAdminReviewForm((s) => ({ ...s, comment: e.target.value }))}
                      placeholder="Write review details..."
                      rows={3}
                      className="input resize-none"
                    />
                  </Field>

                  <Field label="Initial Status">
                    <select
                      value={adminReviewForm.status}
                      onChange={(e) => setAdminReviewForm((s) => ({ ...s, status: e.target.value }))}
                      className="input"
                    >
                      <option value="approved">Approved (Live on Storefront)</option>
                      <option value="pending">Pending</option>
                    </select>
                  </Field>

                  <button
                    type="submit"
                    disabled={savingReview}
                    className="btn-primary w-full justify-center py-3"
                  >
                    <Plus size={15} />
                    {savingReview ? "Publishing…" : "Publish Review & Rating"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleUpdateProductRating} className="mt-5 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Set Product Rating Directly</h3>
                    <p className="text-xs text-clay dark:text-white/65 mt-0.5">
                      Directly set the average rating stars and review count for any product.
                    </p>
                  </div>

                  <Field label="Target Product">
                    <select
                      value={ratingOverrideForm.productId}
                      onChange={(e) => handleSelectProductForOverride(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">-- Select a product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Current: {p.averageRating?.toFixed(1) || 0}★)
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Average Star Rating (0.0 - 5.0)">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={ratingOverrideForm.averageRating}
                        onChange={(e) =>
                          setRatingOverrideForm((s) => ({ ...s, averageRating: e.target.value }))
                        }
                        className="input font-semibold"
                        required
                      />
                      <div className="flex items-center gap-1 text-amber-500 shrink-0">
                        <Star size={16} className="fill-current" />
                        <span className="text-sm font-semibold">{ratingOverrideForm.averageRating}★</span>
                      </div>
                    </div>
                  </Field>

                  <Field label="Total Reviews Count">
                    <input
                      type="number"
                      min="0"
                      value={ratingOverrideForm.reviewCount}
                      onChange={(e) =>
                        setRatingOverrideForm((s) => ({ ...s, reviewCount: e.target.value }))
                      }
                      className="input font-semibold"
                      required
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={savingRating}
                    className="btn-primary w-full justify-center py-3"
                  >
                    <Check size={15} />
                    {savingRating ? "Saving…" : "Update Product Rating"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Manage & Moderate Reviews */}
          <div className="space-y-4">
            {/* Filter and stats bar */}
            <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-card dark:border-white/12 dark:bg-[#222222]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  All Reviews ({filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"})
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={reviewFilterProduct}
                    onChange={(e) => setReviewFilterProduct(e.target.value)}
                    className="rounded-xl border border-ink/10 bg-transparent px-3 py-1.5 text-xs outline-none dark:border-white/10 max-w-[200px] truncate"
                  >
                    <option value="all">All Products</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={reviewFilterStatus}
                    onChange={(e) => setReviewFilterStatus(e.target.value)}
                    className="rounded-xl border border-ink/10 bg-transparent px-3 py-1.5 text-xs outline-none dark:border-white/10"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 relative">
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder="Search reviews by comment, title, author or product..."
                  className="w-full rounded-xl border border-ink/10 bg-transparent px-3.5 py-2 text-xs outline-none dark:border-white/10"
                />
              </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink/10 p-12 text-center text-sm text-clay dark:border-white/10 dark:text-white/65">
                No reviews found matching the filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-2xl border border-ink/5 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222] transition hover:shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-semibold text-ink dark:bg-white/10 dark:text-white">
                            {review.product?.name || "Product"}
                          </span>
                          {review.product?.averageRating ? (
                            <span className="text-xs text-clay dark:text-white/50">
                              (Product avg: {review.product.averageRating}★)
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-semibold">{review.userName || "Customer"}</span>
                          <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                            <Star size={13} className="fill-current" />
                            {review.rating}/5
                          </span>
                          <span className="text-xs text-clay dark:text-white/50">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={review.status}
                          onChange={async (e) => {
                            await api.patch(endpoints.catalog.adminReview(review._id), {
                              status: e.target.value
                            });
                            await load();
                            toast.success("Review status updated");
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition ${
                            review.status === "approved"
                              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                              : review.status === "rejected"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20"
                          title="Delete review"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {review.title && (
                      <p className="font-semibold text-sm mb-1">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-sm leading-relaxed text-clay dark:text-white/70 bg-sand/40 rounded-xl p-3 dark:bg-white/5">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ImagePicker modal */}
      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleImageSelect}
        multiple
      />
    </div>
  );
};

export default AdminProductsPage;
