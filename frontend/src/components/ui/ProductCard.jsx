import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useShop } from "../../contexts/ShopContext";
import { currency } from "../../utils/format";

const ProductCard = ({ product, compact = false }) => {
  const { addToCart, toggleWishlist, wishlist, setQuickView } = useShop();
  const isWishlisted = wishlist.some((item) => item._id === product._id);

  return (
    <motion.article
      layout
      className="glass card-hover group overflow-hidden rounded-[1.9rem] p-3 shadow-soft"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative overflow-hidden rounded-[1.55rem] bg-[#f2e6d7] dark:bg-white/5">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"}
            alt={product.name}
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
      <div className="px-2 pb-2 pt-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-ink/65 dark:text-white/65">
          <span>{product.brand?.name || "Luxeva"}</span>
          <span className="h-1 w-1 rounded-full bg-ink/25 dark:bg-white/25" />
          <span>{product.category?.name || "Curated"}</span>
        </div>
        <div className="mb-3 flex items-start justify-between gap-3">
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
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-olive px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
        >
          <ShoppingBag size={16} />
          Add to cart
        </button>
      </div>
    </motion.article>
  );
};

export default ProductCard;

