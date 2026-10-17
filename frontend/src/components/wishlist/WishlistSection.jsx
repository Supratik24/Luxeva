import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Search,
  ArrowUpDown,
  Layers,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import ProductCard from "../ui/ProductCard";
import { useShop } from "../../contexts/ShopContext";
import { currency } from "../../utils/format";
import {
  CATEGORY_BUCKETS,
  resolveProductCategory,
  groupWishlistByCategory
} from "../../utils/wishlistCategories";

const WishlistSection = ({ inDashboard = false }) => {
  const { wishlist, addToCart } = useShop();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("shelves"); // 'shelves' (grouped by category) or 'grid' (flat)
  const [addingCategory, setAddingCategory] = useState(null);

  // Group wishlist items by their canonical category
  const categoryGroups = useMemo(() => {
    return groupWishlistByCategory(wishlist);
  }, [wishlist]);

  // Overall totals
  const totalItems = wishlist.length;
  const totalValue = useMemo(() => {
    return wishlist.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [wishlist]);

  // Filtered & sorted products based on search, activeCategory tab, and sort option
  const filteredProducts = useMemo(() => {
    let result = [...wishlist];

    // Filter by active category tab if not 'all'
    if (activeCategory !== "all") {
      result = result.filter((product) => {
        const cat = resolveProductCategory(product);
        return cat.id === activeCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(q);
        const brandMatch = (product.brand?.name || "").toLowerCase().includes(q);
        const catMatch = (product.category?.name || "").toLowerCase().includes(q);
        return nameMatch || brandMatch || catMatch;
      });
    }

    // Sort products
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case "discount":
        result.sort((a, b) => Number(b.discountPercent || 0) - Number(a.discountPercent || 0));
        break;
      case "recent":
      default:
        // Default order preserves addition order
        break;
    }

    return result;
  }, [wishlist, activeCategory, searchQuery, sortBy]);

  // Add an entire category to cart
  const handleAddCategoryToCart = async (group) => {
    if (!group?.products?.length) return;
    setAddingCategory(group.category.id);

    try {
      let addedCount = 0;
      group.products.forEach((product) => {
        const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;
        if (!isOutOfStock) {
          addToCart(product, 1, {}, true);
          addedCount += 1;
        }
      });

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} ${group.category.shortName} item${addedCount > 1 ? "s" : ""} to your cart!`);
      } else {
        toast.error("Selected items in this category are currently out of stock.");
      }
    } finally {
      setAddingCategory(null);
    }
  };

  // Add all displayed items to cart
  const handleAddAllToCart = () => {
    if (!filteredProducts.length) return;
    let addedCount = 0;
    filteredProducts.forEach((product) => {
      const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;
      if (!isOutOfStock) {
        addToCart(product, 1, {}, true);
        addedCount += 1;
      }
    });

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} saved item${addedCount > 1 ? "s" : ""} to your cart!`);
    } else {
      toast.error("All saved items are currently out of stock.");
    }
  };

  // If user's wishlist is empty
  if (totalItems === 0) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-8 sm:p-12 text-center shadow-card dark:border-white/12 dark:bg-[#1a1a1a]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sand/70 text-ink dark:bg-white/8 dark:text-white">
          <Heart size={36} className="stroke-[1.5]" />
        </div>
        <h2 className="mt-6 font-display text-2xl sm:text-3xl font-semibold text-ink dark:text-white">
          Your Wishlist is Empty
        </h2>
        <p className="mt-2.5 max-w-md mx-auto text-sm text-clay dark:text-white/70 leading-relaxed">
          Keep track of your favorite clothing, electronics, footwear, and home essentials all in one place.
        </p>

        {/* Category inspiration quick links */}
        <div className="mt-8 pt-8 border-t border-ink/8 dark:border-white/10 max-w-lg mx-auto">
          <p className="text-xs uppercase tracking-wider font-semibold text-clay/70 dark:text-white/50 mb-3">
            Explore Popular Collections
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Clothing & Ethnic", slug: "women-ethnic" },
              { label: "Men's Fashion", slug: "men-fashion" },
              { label: "Electronics & Audio", slug: "electronics" },
              { label: "Footwear", slug: "footwear" },
              { label: "Home & Kitchen", slug: "home-kitchen" }
            ].map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="rounded-full border border-ink/10 bg-sand/40 px-3.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink/30 hover:bg-sand dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Start Exploring
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stat Strip */}
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 sm:p-6 shadow-card dark:border-white/12 dark:bg-[#1a1a1a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10 text-ink dark:text-white">
                <Heart size={14} className="fill-current text-rose-500" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink dark:text-white">
                Saved Collections
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-clay dark:text-white/70">
              <span className="font-semibold text-ink dark:text-white">{totalItems}</span> {totalItems === 1 ? "item" : "items"} organized across{" "}
              <span className="font-semibold text-ink dark:text-white">{categoryGroups.length}</span> {categoryGroups.length === 1 ? "category" : "categories"} · Total value:{" "}
              <span className="font-semibold text-ink dark:text-white">{currency(totalValue)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90"
            >
              <ShoppingCart size={14} />
              <span>Move All to Cart</span>
            </button>
            <Link
              to="/shop"
              className="flex items-center gap-1 rounded-full border border-ink/10 px-4 py-2 text-xs font-medium text-ink transition hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            >
              <span>Explore More</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Category Breakdown Badges */}
        <div className="mt-4 pt-4 border-t border-ink/8 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-clay/60 dark:text-white/40 font-medium">Categories:</span>
          {categoryGroups.map((group) => {
            const Icon = group.category.icon;
            const isActive = activeCategory === group.category.id;
            return (
              <button
                key={group.category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(isActive ? "all" : group.category.id);
                  if (viewMode === "shelves" && !isActive) {
                    setViewMode("shelves");
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-ink text-white dark:bg-white dark:text-ink shadow-sm"
                    : "bg-sand/60 text-clay hover:text-ink hover:bg-sand dark:bg-white/8 dark:text-white/75 dark:hover:bg-white/15"
                }`}
              >
                <Icon size={12} />
                <span>{group.category.shortName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white dark:bg-black/20 dark:text-ink" : "bg-black/8 dark:bg-white/10"
                }`}>
                  {group.products.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Category Navigation Tabs, Search, Sort & View Mode */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === "all"
                ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                : "border border-ink/10 bg-white text-clay hover:text-ink dark:border-white/12 dark:bg-[#1a1a1a] dark:text-white/70 dark:hover:text-white"
            }`}
          >
            <Layers size={13} />
            <span>All Wishlists ({totalItems})</span>
          </button>

          {categoryGroups.map((group) => {
            const Icon = group.category.icon;
            const isSelected = activeCategory === group.category.id;
            return (
              <button
                key={group.category.id}
                type="button"
                onClick={() => setActiveCategory(group.category.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "border border-ink/10 bg-white text-clay hover:text-ink dark:border-white/12 dark:bg-[#1a1a1a] dark:text-white/70 dark:hover:text-white"
                }`}
              >
                <Icon size={13} />
                <span>{group.category.shortName}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-ink"
                    : "bg-ink/8 text-ink dark:bg-white/10 dark:text-white"
                }`}>
                  {group.products.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort & View Mode Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay/60 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved items..."
              className="h-9 w-full rounded-full border border-ink/10 bg-white pl-8 pr-7 text-xs text-ink placeholder:text-clay/50 outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-clay/60 hover:text-ink dark:text-white/40 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 appearance-none rounded-full border border-ink/10 bg-white pl-3.5 pr-8 text-xs font-medium text-ink outline-none transition focus:border-ink/30 dark:border-white/12 dark:bg-[#1a1a1a] dark:text-white dark:focus:border-white/30 cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
            <ArrowUpDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-clay/60 dark:text-white/40" />
          </div>

          {/* View Mode Toggle (Categorized Shelves vs Flat Grid) */}
          {activeCategory === "all" && !searchQuery && (
            <div className="flex items-center rounded-full border border-ink/10 bg-white p-0.5 dark:border-white/12 dark:bg-[#1a1a1a]">
              <button
                type="button"
                onClick={() => setViewMode("shelves")}
                title="View categorized shelves"
                className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition ${
                  viewMode === "shelves"
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span className="hidden sm:inline">Shelves</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="View all in flat grid"
                className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredProducts.length === 0 ? (
        /* Empty Filter Results */
        <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center dark:border-white/12 dark:bg-[#1a1a1a]">
          <p className="text-sm font-semibold text-ink dark:text-white">No items found</p>
          <p className="mt-1 text-xs text-clay dark:text-white/60">
            {searchQuery
              ? `No saved items match "${searchQuery}".`
              : "No items saved in this category yet."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Clear Search
              </button>
            )}
            {activeCategory !== "all" && (
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-ink"
              >
                View All Categories
              </button>
            )}
          </div>
        </div>
      ) : activeCategory === "all" && viewMode === "shelves" && !searchQuery ? (
        /* CATEGORIZED SHELVES VIEW (Separate product wishlist for each category) */
        <div className="space-y-10">
          {categoryGroups.map((group) => {
            const Icon = group.category.icon;
            const isAdding = addingCategory === group.category.id;

            return (
              <section
                key={group.category.id}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-white p-5 sm:p-7 shadow-card dark:border-white/12 dark:bg-[#1e1e1e]/90 transition-all"
              >
                {/* Category Shelf Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-ink/8 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sand/80 text-ink dark:bg-white/10 dark:text-white shadow-sm">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-white">
                          {group.category.name}
                        </h3>
                        <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-ink dark:bg-white/10 dark:text-white">
                          {group.products.length} {group.products.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <p className="text-xs text-clay dark:text-white/65 mt-0.5 line-clamp-1">
                        {group.category.description}
                        {group.subCategories?.length > 1 && (
                          <span className="ml-1 text-clay/70 dark:text-white/45">
                            ({group.subCategories.join(" · ")})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this category shelf */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddCategoryToCart(group)}
                      className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-ink hover:text-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-ink disabled:opacity-50"
                      title={`Add all ${group.products.length} ${group.category.shortName} items to cart`}
                    >
                      <ShoppingCart size={13} />
                      <span>{isAdding ? "Adding..." : `Add ${group.category.shortName} to Cart`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(group.category.id)}
                      className="flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-medium text-clay hover:text-ink dark:text-white/60 dark:hover:text-white"
                      title={`Focus solely on ${group.category.shortName}`}
                    >
                      <span>Focus</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Shelf Products Grid */}
                <div className={`mt-6 grid gap-5 ${
                  inDashboard
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                }`}>
                  {group.products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      compact={inDashboard}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* SINGLE CATEGORY FOCUSED OR FLAT GRID VIEW */
        <div className="space-y-6">
          {/* Active Category Header Banner if viewing single category */}
          {activeCategory !== "all" && (
            <div className="rounded-2xl border border-ink/10 bg-sand/30 p-4 sm:p-5 dark:border-white/12 dark:bg-[#1a1a1a]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentCat = CATEGORY_BUCKETS[activeCategory] || {
                      name: activeCategory,
                      shortName: activeCategory,
                      icon: ShoppingBag,
                      description: "Saved collection"
                    };
                    const CatIcon = currentCat.icon;
                    return (
                      <>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">
                          <CatIcon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-ink dark:text-white">
                              {currentCat.name}
                            </h3>
                            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink dark:bg-white/10 dark:text-white">
                              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                            </span>
                          </div>
                          <p className="text-xs text-clay dark:text-white/65 mt-0.5">
                            {currentCat.description}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddAllToCart}
                    className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-ink/85 dark:bg-white dark:text-ink dark:hover:bg-white/90"
                  >
                    <ShoppingCart size={13} />
                    <span>Add All to Cart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-clay hover:text-ink dark:border-white/12 dark:text-white/70 dark:hover:text-white"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className={`grid gap-5 ${
            inDashboard
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
          }`}>
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  compact={inDashboard}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistSection;
