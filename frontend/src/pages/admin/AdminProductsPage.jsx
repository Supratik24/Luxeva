import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";

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

  const load = () =>
    Promise.all([
      api.get(endpoints.catalog.products),
      api.get(endpoints.catalog.meta),
      api.get(endpoints.catalog.adminCoupons),
      api.get(endpoints.catalog.adminReviews)
    ]).then(([productsRes, metaRes, couponsRes, reviewsRes]) => {
      setProducts(productsRes.data.products || []);
      setMeta(metaRes.data);
      setCoupons(couponsRes.data.coupons || []);
      setReviews(reviewsRes.data.reviews || []);
    });

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    const { data } = await api.post(endpoints.catalog.uploadImages, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setForm((current) => ({ ...current, images: [...current.images, ...data.files] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let parsedVariants = [];

    try {
      parsedVariants = form.variants ? JSON.parse(form.variants) : [];
    } catch (error) {
      toast.error("Variants must be valid JSON");
      return;
    }

    const payload = {
      ...form,
      colors: String(form.colors).split(",").map((item) => item.trim()).filter(Boolean),
      sizes: String(form.sizes).split(",").map((item) => item.trim()).filter(Boolean),
      tags: String(form.tags).split(",").map((item) => item.trim()).filter(Boolean),
      variants: parsedVariants
    };

    if (editingId) await api.put(endpoints.catalog.adminProduct(editingId), payload);
    else await api.post(endpoints.catalog.adminProducts, payload);

    setForm(initialProduct);
    setEditingId(null);
    await load();
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      ...product,
      colors: product.colors?.join(", ") || "",
      sizes: product.sizes?.join(", ") || "",
      tags: product.tags?.join(", ") || "",
      variants: product.variants?.length ? JSON.stringify(product.variants) : ""
    });
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-ink/10 p-5 dark:border-white/10">
        <p className="text-sm font-semibold">{editingId ? "Edit product" : "Add product"}</p>
        <div className="mt-4 space-y-3">
          {["name", "shortDescription", "description", "sku", "price", "compareAtPrice", "stock", "colors", "sizes", "tags"].map((field) => (
            <input
              key={field}
              value={form[field]}
              onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))}
              placeholder={field}
              className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
            />
          ))}
          <textarea
            value={form.variants}
            onChange={(e) => setForm((s) => ({ ...s, variants: e.target.value }))}
            rows="4"
            placeholder='variants JSON: [{"size":"M","color":"Oat","sku":"LX-TR-1001-M","stock":4}]'
            className="w-full rounded-[1.5rem] border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          />
          <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
            <option value="">Category</option>
            {meta.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
          <select value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
            <option value="">Brand</option>
            {meta.brands.map((brand) => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
          </select>
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-sm dark:border-white/10">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} />
            Featured
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-sm dark:border-white/10">
            <input type="checkbox" checked={form.trending} onChange={(e) => setForm((s) => ({ ...s, trending: e.target.checked }))} />
            Trending
          </label>
          <label className="block rounded-2xl border border-dashed border-ink/15 px-4 py-4 text-sm dark:border-white/15">
            Upload images
            <input type="file" multiple className="mt-3 block" onChange={(e) => handleUpload(e.target.files)} />
          </label>
          <button type="submit" className="w-full rounded-full bg-ink px-5 py-4 text-sm font-semibold text-white">
            {editingId ? "Update product" : "Create product"}
          </button>
        </div>
      </form>
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product._id} className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">SKU {product.sku} | Stock {product.stock}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(product)} className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold dark:border-white/10">Edit</button>
                <button type="button" onClick={async () => { await api.delete(endpoints.catalog.adminProduct(product._id)); await load(); }} className="rounded-full bg-[#a12d2d] px-4 py-2 text-sm font-semibold text-white">Delete</button>
              </div>
            </div>
          </div>
        ))}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
            <p className="font-semibold">Categories & brands</p>
            <div className="mt-4 flex gap-2">
              <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="New category" className="w-full rounded-full border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
              <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminCategories, { name: categoryName }); setCategoryName(""); await load(); }} className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">Add</button>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="New brand" className="w-full rounded-full border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
              <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminBrands, { name: brandName }); setBrandName(""); await load(); }} className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">Add</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Categories</p>
                {meta.categories.map((item) => <p key={item._id} className="text-sm text-ink/60 dark:text-white/60">{item.name}</p>)}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Brands</p>
                {meta.brands.map((item) => <p key={item._id} className="text-sm text-ink/60 dark:text-white/60">{item.name}</p>)}
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
            <p className="font-semibold">Coupons</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={couponForm.code} onChange={(e) => setCouponForm((s) => ({ ...s, code: e.target.value }))} placeholder="Code" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
              <input value={couponForm.value} onChange={(e) => setCouponForm((s) => ({ ...s, value: Number(e.target.value) }))} placeholder="Value" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
              <select value={couponForm.type} onChange={(e) => setCouponForm((s) => ({ ...s, type: e.target.value }))} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
                <option value="percentage">percentage</option>
                <option value="fixed">fixed</option>
              </select>
              <input value={couponForm.minOrderAmount} onChange={(e) => setCouponForm((s) => ({ ...s, minOrderAmount: Number(e.target.value) }))} placeholder="Min order" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
            </div>
            <button type="button" onClick={async () => { await api.post(endpoints.catalog.adminCoupons, couponForm); setCouponForm({ code: "", type: "percentage", value: 10, minOrderAmount: 0 }); await load(); }} className="mt-4 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
              Create coupon
            </button>
            <div className="mt-4 space-y-2">
              {coupons.map((coupon) => <p key={coupon._id} className="text-sm text-ink/60 dark:text-white/60">{coupon.code} | {coupon.type} | {coupon.value}</p>)}
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
          <p className="font-semibold">Review moderation</p>
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-[1.3rem] bg-ink/5 p-4 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{review.product?.name}</p>
                    <p className="text-sm text-ink/50 dark:text-white/50">{review.userName} | {review.rating}/5</p>
                  </div>
                  <select
                    value={review.status}
                    onChange={async (e) => {
                      await api.patch(endpoints.catalog.adminReview(review._id), { status: e.target.value });
                      await load();
                    }}
                    className="rounded-full border border-ink/10 bg-transparent px-4 py-2 text-sm outline-none dark:border-white/10"
                  >
                    <option value="approved">approved</option>
                    <option value="pending">pending</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <p className="mt-3 text-sm text-ink/65 dark:text-white/65">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
