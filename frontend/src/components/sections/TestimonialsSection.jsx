const TestimonialsSection = ({ testimonials = [] }) => (
  <section className="section-shell mt-20">
    <div className="glass rounded-[2.3rem] p-6 shadow-soft sm:p-10">
      <p className="eyebrow">Testimonials</p>
      <h2 className="mt-3 font-display text-4xl">What customers love</h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <article key={index} className="rounded-[1.8rem] border border-white/30 bg-white/55 p-6 dark:border-white/10 dark:bg-white/5">
            <p className="text-base leading-7 text-ink/72 dark:text-white/72">"{item.quote || item.message}"</p>
            <p className="mt-6 font-semibold">{item.name}</p>
            <p className="text-sm text-ink/50 dark:text-white/50">{item.role || "Verified customer"}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
