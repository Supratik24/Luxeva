import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = ({ banners = [] }) => {
  const banner = banners?.[0];

  return (
    <section className="section-shell pt-12 pb-20 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="eyebrow">
            {banner?.eyebrow || "New season · 2026"}
          </span>
          <h1 className="mt-5 headline text-ink dark:text-white">
            {banner?.title || (
              <>
                Fine things,<br />
                <em className="not-italic text-clay">effortlessly</em> found.
              </>
            )}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-clay dark:text-white/50 max-w-md">
            {banner?.description ||
              "A curated collection of premium essentials — where design meets quality at every price point."}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to={banner?.ctaLink || "/shop"} className="btn-primary">
              {banner?.ctaLabel || "Shop the collection"}
              <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="btn-ghost">
              Our story
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex gap-8 border-t border-ink/6 pt-8 dark:border-white/6">
            {[
              { value: "12K+", label: "Happy customers" },
              { value: "4.9", label: "Average rating" },
              { value: "Free", label: "Returns always" }
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-2xl font-semibold text-ink dark:text-white">{value}</p>
                <p className="mt-0.5 text-xs text-clay dark:text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl bg-sand dark:bg-white/5 aspect-[4/5]">
            <img
              src={
                banner?.image ||
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80"
              }
              alt={banner?.title || "Luxeva hero"}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            {/* Floating card */}
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
              <p className="eyebrow mb-2">{banner?.subtitle || "Editor's pick"}</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-xl font-semibold leading-snug">
                  {banner?.cardTitle || "Limited seasonal edit"}
                </p>
                <span className="badge bg-ink text-white dark:bg-white dark:text-ink shrink-0">
                  30% off
                </span>
              </div>
            </div>
          </div>

          {/* Floating accent pill */}
          <div className="absolute -right-3 top-10 hidden lg:block">
            <div className="glass rounded-2xl px-4 py-3 shadow-float">
              <p className="text-xs font-semibold text-ink dark:text-white">✦ Free shipping over ₹999</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
