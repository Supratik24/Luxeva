const NewsletterSection = () => (
  <section className="section-shell mt-20">
    <div className="overflow-hidden rounded-[2.6rem] bg-ink px-6 py-12 text-white shadow-soft sm:px-10 lg:px-14">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow text-sand/75">Newsletter</p>
          <h2 className="mt-3 font-display text-4xl">A more tailored inbox.</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
            Get new arrivals, flash sale alerts, styling notes, and private drops without the noise.
          </p>
        </div>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            placeholder="Enter your email"
            className="rounded-full border border-white/10 bg-white/10 px-5 py-4 text-sm outline-none placeholder:text-white/50"
          />
          <button type="submit" className="rounded-full bg-white px-6 py-4 text-sm font-semibold text-ink">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  </section>
);

export default NewsletterSection;
