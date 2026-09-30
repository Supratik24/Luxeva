import { ArrowRight } from "lucide-react";

const NewsletterSection = () => (
  <section className="section-shell mt-24 mb-8">
    <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-white sm:px-12 lg:px-16">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/4 blur-2xl" />
      </div>

      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="eyebrow text-white/40">Newsletter</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-snug sm:text-4xl">
            Get the inside edit.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            New arrivals, private drops, flash sales — curated weekly, no noise.
          </p>
        </div>

        <form
          className="flex w-full max-w-sm flex-col gap-2.5 sm:flex-row lg:max-w-none lg:flex-col xl:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="your@email.com"
            className="input flex-1 border-white/10 bg-white/8 text-white placeholder:text-white/30 focus:border-white/25 focus:ring-white/8"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-white/90 active:scale-95 shrink-0"
          >
            Subscribe
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  </section>
);

export default NewsletterSection;
