import { Grid2x2, List, SlidersHorizontal, Star } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import SkeletonCard from "../components/ui/SkeletonCard";
import Meta from "../components/ui/Meta";
import api, { endpoints } from "../services/api";
import { currency } from "../utils/format";

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState({ categories: [], brands: [] });
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState("grid");
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const deferredSearch = useDeferredValue(searchText);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      availability: searchParams.get("availability") || "",
      color: searchParams.get("color") || "",
      size: searchParams.get("size") || "",
      sort: searchParams.get("sort") || "newest",
      page: searchParams.get("page") || 1,
      search: deferredSearch
    }),
    [deferredSearch, searchParams]
  );

  useEffect(() => {
    api.get(endpoints.catalog.meta).then(({ data }) => setCatalog(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get(endpoints.catalog.products, { params: filters })
      .then(({ data }) => {
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 1 });
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    startTransition(() => setSearchParams(next));
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Shop" description="Browse premium products with filtering, sorting, and responsive layouts." />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Explore</p>
          <h1 className="mt-3 font-display text-5xl">Curated shop</h1>
          <p className="mt-3 text-muted">Search live, filter fast, and switch between a clean grid or editorial list layout.</p>
        </div>
        <div className="glass flex items-center gap-2 rounded-full p-2">
          <button type="button" onClick={() => setLayout("grid")} className={`rounded-full px-3 py-2 ${layout === "grid" ? "bg-ink text-white" : ""}`}>
            <Grid2x2 size={16} />
          </button>
          <button type="button" onClick={() => setLayout("list")} className={`rounded-full px-3 py-2 ${layout === "list" ? "bg-ink text-white" : ""}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="glass h-fit rounded-[2rem] p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={16} />
            <p className="text-sm font-semibold">Advanced filters</p>
          </div>
          <div className="space-y-5">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onBlur={() => updateParam("search", searchText)}
              placeholder="Search products"
              className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
            />
            <select value={filters.category} onChange={(e) => updateParam("category", e.target.value)} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
              <option value="">All categories</option>
              {catalog.categories.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            <select value={filters.brand} onChange={(e) => updateParam("brand", e.target.value)} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
              <option value="">All brands</option>
              {catalog.brands.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateParam("minPrice", e.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateParam("maxPrice", e.target.value)} className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
            </div>
            <select value={filters.rating} onChange={(e) => updateParam("rating", e.target.value)} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
              <option value="">Any rating</option>
              <option value="4">4 stars & up</option>
              <option value="3">3 stars & up</option>
            </select>
            <select value={filters.availability} onChange={(e) => updateParam("availability", e.target.value)} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
              <option value="">Any stock</option>
              <option value="in-stock">In stock</option>
            </select>
            <select value={filters.sort} onChange={(e) => updateParam("sort", e.target.value)} className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10">
              <option value="newest">Newest</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="best-selling">Best selling</option>
              <option value="top-rated">Top rated</option>
            </select>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-ink/60 dark:text-white/60">{products.length} products</p>
            <p className="text-sm text-ink/60 dark:text-white/60">
              Price range: {currency(Number(filters.minPrice || 0))} - {currency(Number(filters.maxPrice || 1000))}
            </p>
          </div>
          <div className={layout === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
              : products.map((product) =>
                  layout === "grid" ? (
                    <ProductCard key={product._id} product={product} compact />
                  ) : (
                    <div key={product._id} className="glass grid gap-4 rounded-[2rem] p-4 shadow-soft md:grid-cols-[220px_1fr]">
                      <img
                        src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"}
                        alt={product.name}
                        className="h-56 w-full rounded-[1.5rem] object-cover"
                      />
                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="mb-3 flex items-center gap-2 text-sm text-amber-500">
                            <Star size={14} className="fill-current" /> {product.averageRating || 4.8}
                          </div>
                          <h3 className="font-display text-3xl">{product.name}</h3>
                          <p className="mt-3 max-w-2xl text-muted">{product.shortDescription || product.description}</p>
                        </div>
                        <p className="text-xl font-semibold">{currency(product.price)}</p>
                      </div>
                    </div>
                  )
                )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {Array.from({ length: pagination.pages || 1 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateParam("page", String(index + 1))}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  Number(filters.page) === index + 1 ? "bg-ink text-white" : "glass"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopPage;

