import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const TestimonialsSection = ({ testimonials = [] }) => (
  <section className="section-shell mt-24">
    <div className="mb-10">
      <p className="eyebrow">Testimonials</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Loved by thousands
      </h2>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {testimonials.map((item, index) => (
        <motion.article
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-card dark:border-white/5 dark:bg-white/4"
        >
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <Quote size={20} className="text-ink/10 dark:text-white/10 -mb-2" />
          <p className="text-sm leading-relaxed text-clay dark:text-white/50 flex-1">
            {item.quote || item.message}
          </p>
          <div className="flex items-center gap-3 border-t border-black/5 pt-4 dark:border-white/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sand font-semibold text-sm dark:bg-white/8">
              {item.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{item.name}</p>
              <p className="mt-1 text-xs text-clay dark:text-white/35">{item.role || "Verified customer"}</p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);

export default TestimonialsSection;
