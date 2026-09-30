import { Heart, Star, ShoppingBag } from "lucide-react";
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
  const isWishlisted = wishlist?.some((item) => item?._id === product?._id) || false;
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || "");
  const showColorOptions = product?.colors && hasRealColorOptions(product.colors);
  const hasImageVariants = product && hasVariantImageOptions(product);
  const activeImage = hasImageVariants ? getVariantImage(product, selectedColor) : product?.images?.[0];

  useEffect(() => {
    setSelectedColor(product?.colors?.[0] || "");
  }, [product?._id, product?.colors]);

  if (!product) return null;

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  return (
    <motion.article
      layout
      className="group flex h-full flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Image container */}
      <div className="relative overflow-hidden rounded-2xl bg-sand dark:bg-white/5 aspect-[3/4]">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={
              activeImage?.url ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
            }
            alt={activeImage?.alt || product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="badge bg-ink/85 text-white backdrop-blur-sm">Featured</span>
          )}
          {discount && (
            <span className="badge bg-white/90 text-ink backdrop-blur-sm">-{discount}%</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => toggleWishlist(product._id)}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
            isWishlisted
              ? "bg-ink text-white dark:bg-white dark:text-ink"
              : "bg-white/80 text-ink opacity-0 backdrop-blur-sm group-hover:opacity-100 dark:bg-black/50 dark:text-white"
          }`}
        >
          <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
        </button>

        {/* Hover actions bar */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setQuickView(product)}
            className="flex-1 rounded-xl bg-white/90 py-2.5 text-xs font-semibold text-ink backdrop-blur-sm transition hover:bg-white dark:bg-black/70 dark:text-white dark:hover:bg-black/90"
          >
            Quick view
          </button>
          <button
            type="button"
            onClick={() => addToCart(product, { color: selectedColor, size: product?.sizes?.[0] || "" })}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition hover:opacity-80 dark:bg-white dark:text-ink"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 flex flex-col flex-1 px-0.5">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-clay dark:text-white/35">
            {product.category?.name || "Curated"}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-clay dark:text-white/35">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {product.averageRating?.toFixed?.(1) || "4.8"}
            <span className="text-clay/60 dark:text-white/20">({product.reviewCount || 18})</span>
          </span>
        </div>

        {/* Name */}
        <Link
          to={`/product/${product.slug}`}
          className="text-sm font-semibold leading-snug text-ink hover:text-clay transition-colors dark:text-white dark:hover:text-white/60 line-clamp-2"
        >
          {product.name}
        </Link>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink dark:text-white">{currency(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-clay line-through dark:text-white/30">
              {currency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Color swatches */}
        {showColorOptions && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.colors.slice(0, 5).map((color) => {
              const swatchConfig = getColorConfig(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Choose ${color}`}
                  title={color}
                  className={`h-5 w-5 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-ink ring-offset-1 dark:ring-white"
                      : "ring-1 ring-black/10 dark:ring-white/10"
                  }`}
                  style={{ backgroundColor: swatchConfig.swatch }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default ProductCard;
