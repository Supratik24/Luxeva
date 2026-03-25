import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = ({ banners = [] }) => {
  const banner = banners[0];

  return (
    <section className="section-shell pt-10 sm:pt-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="eyebrow">Modern luxury, delivered</p>
          <h1 className="headline mt-5 max-w-2xl">
            {banner?.title || "Elevated everyday pieces for the way you actually live."}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink/68 dark:text-white/68">
            {banner?.description ||
              "Explore a polished shopping experience with premium essentials, rich product detail, fast search, smooth checkout, and a secure admin system behind the scenes."}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={banner?.ctaLink || "/shop"} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
              {banner?.ctaLabel || "Shop the collection"}
              <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-6 py-4 text-sm font-semibold dark:border-white/10">
              <Sparkles size={16} />
              Our story
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="hero-glow relative overflow-hidden rounded-[2.5rem] bg-[#e8d8c7] p-3 shadow-soft dark:bg-white/5"
        >
          <img
            src={
              banner?.image ||
              "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80"
            }
            alt={banner?.title || "Luxeva hero"}
            className="h-[520px] w-full rounded-[2rem] object-cover"
          />
          <div className="absolute bottom-8 left-8 right-8 glass rounded-[1.8rem] p-5 shadow-soft">
            <p className="eyebrow">Handpicked this week</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-3xl">{banner?.subtitle || "Limited seasonal edit"}</p>
                <p className="text-muted mt-2">Curated with elevated materials, soft silhouettes, and timeless tones.</p>
              </div>
              <div className="hidden rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white sm:block">Up to 30% off</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

