import { Heart, ShoppingBag, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useShop } from "../../contexts/ShopContext";
import { currency } from "../../utils/format";
import {
  getColorConfig,
  getVariantImage,
  hasRealColorOptions,
  hasVariantImageOptions
} from "../../utils/productOptions";

const ProductCard = ({ product, compact = false }) => {
  const { addToCart, toggleWishlist, wishlist, setQuickView } = useShop();
  const isWishlisted = wishlist.some((item) => item._id === product._id);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const colorConfig = getColorConfig(selectedColor || product.colors?.[0] || "standard");
  const showColorOptions = hasRealColorOptions(product.colors);
  const hasImageVariants = hasVariantImageOptions(product);
  const activeImage = hasImageVariants ? getVariantImage(product, selectedColor) : product.images?.[0];

  useEffect(() => {
    setSelectedColor(product.colors?.[0] || "");
    setSelectedSize(product.sizes?.[0] || "");
  }, [product._id, product.colors, product.sizes]);

  return (
    <motion.article
      layout
      className="glass card-hover group flex h-full flex-col overflow-hidden rounded-[1.9rem] p-3 shadow-soft"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative overflow-hidden rounded-[1.55rem] dark:bg-white/5" style={{ background: colorConfig.surface }}>
        <Link to={`/product/${product.slug}`}>
          <img
            src={activeImage?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"}
            alt={activeImage?.alt || product.name}
            className={`w-full object-cover transition duration-500 group-hover:scale-105 ${compact ? "h-56" : "h-72"}`}
          />
        </Link>
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">
            {product.featured ? "Featured" : "New"}
          </span>
          <button
            type="button"
            onClick={() => toggleWishlist(product._id)}
            className="glass rounded-full p-2 text-ink dark:text-white"
          >
            <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setQuickView(product)}
          className="absolute inset-x-4 bottom-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100"
        >
          Quick view
        </button>
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-ink/65 dark:text-white/65">
          <span>{product.brand?.name || "Luxeva"}</span>
          <span className="h-1 w-1 rounded-full bg-ink/25 dark:bg-white/25" />
          <span>{product.category?.name || "Curated"}</span>
        </div>
        <div className="mb-3 min-h-[92px] flex items-start justify-between gap-3">
          <div>
            <Link to={`/product/${product.slug}`} className="line-clamp-2 text-lg font-semibold">
              {product.name}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-sm text-amber-500">
              <Star size={14} className="fill-current" />
              {product.averageRating?.toFixed?.(1) || "4.8"} ({product.reviewCount || 18})
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{currency(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-sm text-ink/50 line-through dark:text-white/45">
                {currency(product.compareAtPrice)}
              </p>
            ) : null}
          </div>
        </div>
        {showColorOptions ? (
          <div className="mb-4 min-h-[44px] flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {product.colors.slice(0, 4).map((color) => {
                const swatchConfig = getColorConfig(color);
                const active = selectedColor === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Choose ${color}`}
                    title={color}
                    className={`rounded-full p-1 transition ${active ? "scale-110 ring-2 ring-ink/60 dark:ring-white/70" : "ring-1 ring-ink/10 dark:ring-white/10"}`}
                  >
                    <span
                      className="block h-5 w-5 rounded-full"
                      style={{ backgroundColor: swatchConfig.swatch, border: `1px solid ${swatchConfig.border}` }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45 dark:text-white/45">
              {selectedColor}
            </p>
          </div>
        ) : product.colors?.length === 1 ? (
          <div className="mb-4 min-h-[44px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/50 dark:border-white/10 dark:text-white/50">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: colorConfig.swatch, border: `1px solid ${colorConfig.border}` }}
              />
              {selectedColor || product.colors[0]}
            </div>
          </div>
        ) : (
          <div className="mb-4 min-h-[44px]" />
        )}
        <button
          type="button"
          onClick={() => addToCart(product, { color: selectedColor, size: selectedSize })}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
        >
          <ShoppingBag size={16} />
          Add to cart
        </button>
      </div>
    </motion.article>
  );
};

export default ProductCard;
