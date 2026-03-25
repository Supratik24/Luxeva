import ProductCard from "../ui/ProductCard";
import SkeletonCard from "../ui/SkeletonCard";

const ProductShowcase = ({ title, eyebrow, products = [], loading = false }) => (
  <section className="section-shell mt-20">
    <p className="eyebrow">{eyebrow}</p>
    <h2 className="mt-3 font-display text-4xl">{title}</h2>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
        : products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  </section>
);

export default ProductShowcase;

