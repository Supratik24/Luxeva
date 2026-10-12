import ProductCard from "../ui/ProductCard";
import SkeletonCard from "../ui/SkeletonCard";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const ProductShowcase = ({ title, eyebrow, products = [], loading = false }) => (
  <section className="section-shell mt-24">
    <div className="flex items-end justify-between gap-4 mb-8">
      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl max-w-lg">
          {title}
        </h2>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Link
          to="/shop"
          className="hidden items-center gap-1.5 text-sm font-medium text-clay transition hover:text-ink dark:text-white/60 dark:hover:text-white sm:flex shrink-0"
        >
          View all
          <ArrowUpRight size={15} />
        </Link>
      </motion.div>
    </div>
    
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        : products.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  </section>
);

export default ProductShowcase;
