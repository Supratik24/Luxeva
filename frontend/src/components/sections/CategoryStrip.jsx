import { Link } from "react-router-dom";

const categoryThemes = [
  "from-[#f7efe7] via-white to-[#f2e7dc] dark:from-[#1a1916] dark:via-[#171512] dark:to-[#211b14]",
  "from-[#eef2ec] via-white to-[#e4ebe0] dark:from-[#151815] dark:via-[#121412] dark:to-[#1a2018]",
  "from-[#f6f0e8] via-white to-[#ece3d7] dark:from-[#191714] dark:via-[#151311] dark:to-[#211a14]",
  "from-[#edf2f4] via-white to-[#e5ecef] dark:from-[#14181a] dark:via-[#111416] dark:to-[#182025]"
];

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
          className={`group relative overflow-hidden rounded-[1.8rem] border border-black/8 bg-gradient-to-br ${categoryThemes[index % categoryThemes.length]} p-5 shadow-[0_24px_80px_rgba(18,18,18,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(18,18,18,0.14)] dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.36)]`}
        >
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/[0.04] to-transparent dark:from-white/[0.03]" />
          <div className="relative mb-10 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-olive/10 bg-white text-xl font-bold text-olive shadow-[0_10px_30px_rgba(79,90,69,0.12)] dark:border-white/10 dark:bg-white/10 dark:text-sand">
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="relative text-2xl font-display text-ink dark:text-white">{category.name}</h3>
          <p className="relative mt-2 line-clamp-2 text-base font-medium text-ink/72 dark:text-white/78">
            {category.description || "Refined pieces, practical details, and a premium finish."}
          </p>
        </Link>
      ))}
    </div>
  </section>
);

export default CategoryStrip;
