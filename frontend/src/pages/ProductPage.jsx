import { Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const getAvailableStock = () => {
    if (!product) return 0;
    if ((selection.color || selection.size) && Array.isArray(product.variants) && product.variants.length > 0) {
      const match = product.variants.find((v) => {
        const sizeMatch = !selection.size || String(v.size || "").toLowerCase() === String(selection.size).toLowerCase();
        const colorMatch = !selection.color || String(v.color || "").toLowerCase() === String(selection.color).toLowerCase();
        return sizeMatch && colorMatch;
      });
      if (match && match.stock !== undefined) {
        return Number(match.stock);
      }
    }
    return product.stock !== undefined ? Number(product.stock) : 0;
  };

  const availableStock = getAvailableStock();
  const isOutOfStock = availableStock <= 0;
  const isLowStock = !isOutOfStock && availableStock <= 5;

  const submitReview = async (event) => {
    event.preventDefault();

    if (!reviewForm.comment && !reviewForm.title) {
      toast.error("Please add a comment or title for your review");
      return;
    }

    if (useLocalPreviewData) {
      const newReview = {
        _id: `preview-review-${Date.now()}`,
        userName: "You",
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        title: reviewForm.title,
        createdAt: new Date().toISOString()
      };
      setPayload((current) => ({
        ...current,
        reviews: [newReview, ...(current.reviews || [])]
      }));
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, comment: "", title: "" });
      return;
    }

    try {
      const res = await api.post(endpoints.catalog.review(product._id), reviewForm);
      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, comment: "", title: "" });

      const { data } = await api.get(endpoints.catalog.product(slug));
      if (data?.product) {
        setPayload(data);
      } else if (res.data?.review) {
        setPayload((current) => ({
          ...current,
          reviews: [res.data.review, ...(current.reviews || [])],
          product: {
            ...current.product,
            averageRating: res.data.averageRating ?? current.product.averageRating,
            reviewCount: res.data.reviewCount ?? (current.product.reviewCount + 1)
          }
        }));
      }
    } catch (err) {
      console.error("Submit review error:", err);
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
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
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Out of stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Only {availableStock} left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                In stock ({availableStock} available)
              </span>
            )}
          </div>
          <p className="mt-6 text-3xl font-semibold">{currency(product.price)}</p>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink/68 dark:text-white/68">{product.description}</p>
          {showColorOptions || product.colors?.length === 1 ? (
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold dark:border-white/12">
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

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className={`glass inline-flex items-center rounded-full p-2 ${isOutOfStock ? "opacity-40 cursor-not-allowed" : ""}`}>
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="rounded-full p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 text-sm font-semibold">{isOutOfStock ? 0 : quantity}</span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= availableStock}
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                className="rounded-full p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                if (isOutOfStock) return;
                addToCart(product, selection, quantity);
              }}
              className={`rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
                isOutOfStock
                  ? "bg-stone-400 dark:bg-stone-700 cursor-not-allowed opacity-60"
                  : "bg-olive hover:opacity-90 shadow-soft"
              }`}
            >
              {isOutOfStock ? "Out of stock" : "Add to cart"}
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                if (isOutOfStock) return;
                addToCart(product, selection, quantity);
                navigate("/checkout");
              }}
              className={`rounded-full border px-6 py-4 text-sm font-semibold transition ${
                isOutOfStock
                  ? "border-ink/10 text-ink/30 dark:border-white/10 dark:text-white/30 cursor-not-allowed"
                  : "border-ink/10 dark:border-white/12 hover:bg-ink/5 dark:hover:bg-white/5"
              }`}
            >
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
              <div key={key} className="rounded-[1.3rem] border border-ink/10 p-4 dark:border-white/12">
                <p className="text-xs uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">{key}</p>
                <p className="mt-2 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-[2rem] p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl">Ratings & reviews</h2>
              <p className="mt-1 text-xs text-muted">
                {product.averageRating?.toFixed(1) || "0.0"} out of 5 ({product.reviewCount || payload.reviews.length} reviews)
              </p>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={18} className="fill-current" />
              <span className="font-semibold text-lg">{product.averageRating?.toFixed(1) || "5.0"}</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {!payload.reviews?.length ? (
              <div className="rounded-[1.4rem] border border-dashed border-ink/15 p-6 text-center text-sm text-muted dark:border-white/15">
                No reviews yet for this piece. Be the first to share your thoughts!
              </div>
            ) : (
              payload.reviews.map((review) => (
                <article
                  key={review._id}
                  className="rounded-[1.4rem] border border-ink/10 p-5 shadow-sm dark:border-white/12 bg-white/40 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-bold text-ink dark:bg-white/10 dark:text-white uppercase">
                        {review.userName?.charAt(0) || "U"}
                      </span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{review.userName || "Verified Buyer"}</p>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Verified Buyer</span>
                      </div>
                    </div>
                    <p className="text-xs text-ink/45 dark:text-white/45">{shortDate(review.createdAt)}</p>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={13}
                        className={idx < (review.rating || 5) ? "fill-amber-400 text-amber-400" : "text-ink/15 dark:text-white/15"}
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-ink/75 dark:text-white/75">{review.rating} / 5</span>
                  </div>

                  {review.title ? (
                    <h4 className="mt-2 font-semibold text-sm text-ink dark:text-white">{review.title}</h4>
                  ) : null}

                  {review.comment ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/75 dark:text-white/75">{review.comment}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>

          {isAuthenticated ? (
            <form onSubmit={submitReview} className="mt-6 rounded-[1.4rem] border border-ink/10 p-5 dark:border-white/12 bg-sand/20 dark:bg-white/[0.02]">
              <p className="text-sm font-semibold">Write a review</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Review title (e.g. Excellent fit & quality)"
                  className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/12"
                />
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))}
                  className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/12"
                >
                  <option value={5}>★★★★★ (5 stars - Outstanding)</option>
                  <option value={4}>★★★★☆ (4 stars - Very Good)</option>
                  <option value={3}>★★★☆☆ (3 stars - Average)</option>
                  <option value={2}>★★☆☆☆ (2 stars - Below Average)</option>
                  <option value={1}>★☆☆☆☆ (1 star - Poor)</option>
                </select>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((s) => ({ ...s, comment: e.target.value }))}
                  placeholder="Share details about fit, material quality, and craftsmanship..."
                  rows="4"
                  className="rounded-[1.4rem] border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2"
                />
              </div>
              <button type="submit" className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition">
                Submit review
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-ink/10 p-5 text-center text-sm dark:border-white/12 bg-sand/20 dark:bg-white/[0.02]">
              <p className="font-semibold text-ink dark:text-white">Share your experience</p>
              <p className="mt-1 text-xs text-muted">Please sign in to your Luxeva account to write a review.</p>
            </div>
          )}
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
