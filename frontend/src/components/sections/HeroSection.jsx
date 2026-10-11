import { useState, useEffect } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const HeroSection = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel every 6 seconds
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  // Ensure index stays valid if banners array changes
  const activeIndex = banners.length > 0 ? currentIndex % banners.length : 0;
  const banner = banners?.[activeIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section
      className="section-shell pt-12 pb-20 lg:pt-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Left: Text with AnimatePresence */}
        <div className="min-h-[380px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={banner?._id || activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="eyebrow">
                {banner?.eyebrow || `Featured collection · 0${activeIndex + 1}`}
              </span>

              <h1 className="mt-5 headline text-ink dark:text-white">
                {banner?.title || (
                  <>
                    Fine things,<br />
                    <em className="not-italic text-clay">effortlessly</em> found.
                  </>
                )}
              </h1>

              <p className="mt-6 text-base leading-relaxed text-clay dark:text-white/65 max-w-md">
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
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls & dot indicators */}
          {banners.length > 1 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex gap-2">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? "w-8 bg-ink dark:bg-white"
                        : "w-2 bg-ink/20 dark:bg-white/20 hover:bg-ink/40 dark:hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous banner"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/15 dark:hover:bg-white/10 text-ink dark:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next banner"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 transition hover:bg-ink/5 dark:border-white/15 dark:hover:bg-white/10 text-ink dark:text-white"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs text-clay dark:text-white/50 ml-1 font-mono">
                  {activeIndex + 1}/{banners.length}
                </span>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-10 flex gap-8 border-t border-ink/6 pt-8 dark:border-white/6">
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
        </div>

        {/* Right: Hero image with AnimatePresence */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl bg-sand dark:bg-white/5 aspect-[4/5]">
            <AnimatePresence mode="wait">
              <motion.img
                key={banner?.image || activeIndex}
                src={
                  banner?.image ||
                  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80"
                }
                alt={banner?.title || "Luxeva hero"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="h-full w-full object-cover"
              />
            </AnimatePresence>

            {/* Floating card */}
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4 z-10">
              <p className="eyebrow mb-2">{banner?.subtitle || "Editor's pick"}</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-xl font-semibold leading-snug">
                  {banner?.cardTitle || banner?.subtitle || "Limited seasonal edit"}
                </p>
                <span className="badge bg-ink text-white dark:bg-white dark:text-ink shrink-0">
                  30% off
                </span>
              </div>
            </div>
          </div>

          {/* Floating accent pill */}
          <div className="absolute -right-3 top-10 hidden lg:block z-10">
            <div className="glass rounded-2xl px-4 py-3 shadow-float">
              <p className="text-xs font-semibold text-ink dark:text-white">✦ Free shipping over ₹999</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
