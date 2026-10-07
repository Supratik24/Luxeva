import ProductCard from "../ui/ProductCard";
import SkeletonCard from "../ui/SkeletonCard";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const ProductShowcase = ({ title, eyebrow, products = [], loading = false }) => (
  <section className="section-shell mt-24">
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl max-w-lg">
          {title}
        </h2>
      </div>
      <Link
        to="/shop"
        className="hidden items-center gap-1.5 text-sm font-medium text-clay transition hover:text-ink dark:text-white/60 dark:hover:text-white sm:flex shrink-0"
      >
        View all
        <ArrowUpRight size={15} />
      </Link>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        : products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  </section>
);

export default ProductShowcase;
