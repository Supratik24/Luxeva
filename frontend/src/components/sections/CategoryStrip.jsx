import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const ICONS = ["✦", "◈", "◉", "◆"];

const CategoryStrip = ({ categories = [] }) => (
  <section className="section-shell mt-24">
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <p className="eyebrow">Collections</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Browse by category
        </h2>
      </div>
      <Link
        to="/shop"
        className="hidden items-center gap-1.5 text-sm font-medium text-clay transition hover:text-ink dark:text-white/60 dark:hover:text-white sm:flex"
      >
        View all
        <ArrowUpRight size={15} />
      </Link>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category, index) => (
        <motion.div
          key={category._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
        >
          <Link
            to={`/shop?category=${category._id}`}
            className="group flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-float dark:border-white/10 dark:bg-[#222222]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand text-xl dark:bg-white/10">
                {ICONS[index % ICONS.length]}
              </div>
              <span className="text-xs font-medium text-clay opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-white/55">
                Explore →
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-ink dark:text-white">{category.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-clay dark:text-white/55 line-clamp-2">
                {category.description || "Refined pieces with a premium finish."}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CategoryStrip;
