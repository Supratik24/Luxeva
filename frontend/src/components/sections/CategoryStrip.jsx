import { Link } from "react-router-dom";

const CategoryStrip = ({ categories = [] }) => (
  <section className="section-shell mt-20">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Top categories</p>
        <h2 className="mt-3 font-display text-4xl">Designed to browse beautifully</h2>
      </div>
      <Link to="/shop" className="text-sm font-semibold text-olive">
        Explore all
      </Link>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category, index) => (
        <Link
          key={category._id}
          to={`/shop?category=${category._id}`}
          className="glass group overflow-hidden rounded-[1.8rem] p-5 shadow-soft"
        >
          <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/70 text-xl font-semibold text-olive dark:bg-white/5">
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="text-2xl font-display">{category.name}</h3>
          <p className="mt-2 text-muted line-clamp-2">
            {category.description || "Refined pieces, practical details, and a premium finish."}
          </p>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoryStrip;

