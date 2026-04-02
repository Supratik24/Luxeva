import { Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "../components/ui/ProductCard";
import Meta from "../components/ui/Meta";
import { getMockProductBySlug, useLocalPreviewData } from "../data/mockStorefront";
import { useAuth } from "../contexts/AuthContext";
import api, { endpoints } from "../services/api";
import { useShop } from "../contexts/ShopContext";
import { currency, shortDate } from "../utils/format";
import {
  getColorConfig,
  getVariantImage,
  hasRealColorOptions,
  hasVariantImageOptions
} from "../utils/productOptions";

const ProductPage = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart, saveRecentlyViewed } = useShop();
  const { slug } = useParams();
  const [payload, setPayload] = useState({ product: null, reviews: [], relatedProducts: [] });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selection, setSelection] = useState({ color: "", size: "" });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", title: "" });

  useEffect(() => {
    setLoading(true);

    if (useLocalPreviewData) {
      const fallback = getMockProductBySlug(slug);
      if (fallback) {
        setPayload(fallback);
        saveRecentlyViewed(fallback.product);
        setSelectedImage(0);
        setSelection({
          color: fallback.product.colors?.[0] || "",
          size: fallback.product.sizes?.[0] || ""
        });
      } else {
        setPayload({ product: null, reviews: [], relatedProducts: [] });
      }
      setLoading(false);
      return;
    }

    api
      .get(endpoints.catalog.product(slug))
      .then(({ data }) => {
        setPayload(data);
        if (data.product) {
          saveRecentlyViewed(data.product);
          setSelectedImage(0);
          setSelection({
            color: data.product.colors?.[0] || "",
            size: data.product.sizes?.[0] || ""
          });
        }
      })
      .catch(() => {
        const fallback = getMockProductBySlug(slug);
        if (fallback) {
          setPayload(fallback);
          saveRecentlyViewed(fallback.product);
          setSelectedImage(0);
          setSelection({
            color: fallback.product.colors?.[0] || "",
            size: fallback.product.sizes?.[0] || ""
          });
        } else {
          setPayload({ product: null, reviews: [], relatedProducts: [] });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const product = payload.product;
  const colorConfig = getColorConfig(selection.color || product?.colors?.[0] || "standard");
  const showColorOptions = hasRealColorOptions(product?.colors);
  const hasImageVariants = hasVariantImageOptions(product);
  const activeImage = hasImageVariants ? getVariantImage(product, selection.color) : product?.images?.[0];

  const submitReview = async (event) => {
    event.preventDefault();

    if (useLocalPreviewData) {
      setPayload((current) => ({
        ...current,
        reviews: [
          {
            _id: `preview-review-${Date.now()}`,
            userName: "You",
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            title: reviewForm.title,
            createdAt: new Date().toISOString()
          },
          ...(current.reviews || [])
        ]
      }));
      toast.success("Review submitted");
      setReviewForm({ rating: 5, comment: "", title: "" });
      return;
    }

    await api.post(endpoints.catalog.review(product._id), reviewForm);
    toast.success("Review submitted");
    const { data } = await api.get(endpoints.catalog.product(slug));
    setPayload(data);
    setReviewForm({ rating: 5, comment: "", title: "" });
  };

  if (loading) {
    return <div className="section-shell py-24 text-center text-muted">Loading product experience...</div>;
  }

  if (!product) {
    return <div className="section-shell py-24 text-center text-muted">Product not found.</div>;
  }

  return (
    <section className="section-shell py-12">
      <Meta title={product.name} description={product.shortDescription || product.description} />
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div className="space-y-3">
            {(hasImageVariants ? product.colors.map((color) => getVariantImage(product, color)) : product.images)?.map((image, index) => (
              <button
                key={`${image?.url || "image"}-${index}`}
                type="button"
                onClick={() => {
                  if (hasImageVariants) {
                    const color = product.colors[index];
                    setSelection((current) => ({ ...current, color }));
                  } else {
                    setSelectedImage(index);
                  }
                }}
                className={`block w-full overflow-hidden rounded-[1.4rem] p-1 transition ${
                  (hasImageVariants ? selection.color === product.colors[index] : selectedImage === index)
                    ? "ring-2 ring-ink/70 dark:ring-white/70"
                    : "ring-1 ring-ink/8 dark:ring-white/10"
                }`}
              >
                <img src={image?.url} alt={image?.alt || product.name} className="h-24 w-full rounded-[1.1rem] object-cover" />
              </button>
            ))}
          </div>
          <div className="glass overflow-hidden rounded-[2rem] p-3 shadow-soft" style={{ background: colorConfig.surface }}>
            <img
              src={
                (hasImageVariants ? activeImage?.url : product.images?.[selectedImage]?.url) ||
                product.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80"
              }
              alt={hasImageVariants ? activeImage?.alt || product.name : product.name}
              className="h-[620px] w-full rounded-[1.6rem] object-cover"
            />
          </div>
        </div>

        <div>
          <p className="eyebrow">{product.brand?.name}</p>
          <h1 className="mt-3 font-display text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink/65 dark:text-white/65">
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star size={14} className="fill-current" />
              {product.averageRating?.toFixed?.(1) || 4.8}
            </span>
            <span>{product.reviewCount || payload.reviews.length} reviews</span>
            <span>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
          </div>
          <p className="mt-6 text-3xl font-semibold">{currency(product.price)}</p>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink/68 dark:text-white/68">{product.description}</p>
          {showColorOptions || product.colors?.length === 1 ? (
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold dark:border-white/10">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: colorConfig.swatch, border: `1px solid ${colorConfig.border}` }}
              />
              Selected color: {selection.color}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold">Color</p>
              <div className="flex flex-wrap gap-3">
                {product.colors?.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelection((current) => ({ ...current, color }))}
                    className={`flex min-w-[118px] items-center gap-3 rounded-full px-4 py-3 text-sm transition ${
                      selection.color === color
                        ? "bg-ink text-white shadow-soft"
                        : "glass hover:ring-1 hover:ring-ink/20 dark:hover:ring-white/20"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{
                        backgroundColor: getColorConfig(color).swatch,
                        border: `1px solid ${getColorConfig(color).border}`
                      }}
                    />
                    <span>{color}</span>
                  </button>
                ))}
              </div>
              {!hasImageVariants && product.colors?.length > 1 ? (
                <p className="mt-3 text-xs text-ink/50 dark:text-white/50">
                  Color selection is available. The image stays the same because only one verified product photo is available right now.
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelection((current) => ({ ...current, size }))}
                    className={`rounded-full px-4 py-2 text-sm ${selection.size === size ? "bg-ink text-white" : "glass"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="glass inline-flex items-center rounded-full p-2">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="rounded-full p-2">
                <Minus size={16} />
              </button>
              <span className="px-4 text-sm font-semibold">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} className="rounded-full p-2">
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => Array.from({ length: quantity }).forEach(() => addToCart(product, selection))}
              className="rounded-full bg-olive px-6 py-4 text-sm font-semibold text-white"
            >
              Add to cart
            </button>
            <button type="button" className="rounded-full border border-ink/10 px-6 py-4 text-sm font-semibold dark:border-white/10">
              Buy now
            </button>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-ink/70 dark:text-white/70">
            <div className="glass flex items-center gap-3 rounded-[1.5rem] p-4">
              <Truck size={18} />
              Complimentary shipping over {currency(4999)}
            </div>
            <div className="glass flex items-center gap-3 rounded-[1.5rem] p-4">
              <ShieldCheck size={18} />
              Secure payments, protected admin management, and verified order handling
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass rounded-[2rem] p-6 shadow-soft">
          <h2 className="font-display text-3xl">Specifications</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Object.entries(product.specs || {}).map(([key, value]) => (
              <div key={key} className="rounded-[1.3rem] border border-ink/10 p-4 dark:border-white/10">
                <p className="text-xs uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">{key}</p>
                <p className="mt-2 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-[2rem] p-6 shadow-soft">
          <h2 className="font-display text-3xl">Ratings & reviews</h2>
          <div className="mt-6 space-y-4">
            {payload.reviews.map((review) => (
              <article key={review._id} className="rounded-[1.4rem] border border-ink/10 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{review.userName}</p>
                  <p className="text-sm text-ink/45 dark:text-white/45">{shortDate(review.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-amber-500">{Array.from({ length: review.rating }).map((_, index) => "*")}</p>
                <p className="mt-3 text-muted">{review.comment}</p>
              </article>
            ))}
          </div>
          {isAuthenticated ? (
            <form onSubmit={submitReview} className="mt-6 rounded-[1.4rem] border border-ink/10 p-4 dark:border-white/10">
              <p className="text-sm font-semibold">Leave a review</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={reviewForm.title} onChange={(e) => setReviewForm((s) => ({ ...s, title: e.target.value }))} placeholder="Title" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
                <select value={reviewForm.rating} onChange={(e) => setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                </select>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((s) => ({ ...s, comment: e.target.value }))} placeholder="Share your experience" rows="4" className="rounded-[1.4rem] border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2" />
              </div>
              <button type="submit" className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
                Submit review
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-20">
        <p className="eyebrow">Related products</p>
        <h2 className="mt-3 font-display text-4xl">You may also like</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {payload.relatedProducts.map((item) => (
            <ProductCard key={item._id} product={item} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductPage;
