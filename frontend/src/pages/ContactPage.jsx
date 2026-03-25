import Meta from "../components/ui/Meta";

const ContactPage = () => (
  <section className="section-shell py-12">
    <Meta title="Contact" description="Reach the Luxeva team." />
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-display text-5xl">We’re here to help</h1>
        <p className="mt-5 text-muted">Questions about products, orders, collaborations, or support. Reach out and we’ll respond quickly.</p>
      </div>
      <form className="glass rounded-[2rem] p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Name" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <input placeholder="Email" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <input placeholder="Subject" className="rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2" />
          <textarea placeholder="How can we help?" rows="6" className="rounded-[1.6rem] border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 sm:col-span-2" />
        </div>
        <button type="submit" className="mt-6 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
          Send message
        </button>
      </form>
    </div>
  </section>
);

export default ContactPage;

