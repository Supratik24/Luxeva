import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="mt-24 border-t border-ink/10 py-16 dark:border-white/10">
    <div className="section-shell grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
      <div>
        <p className="font-display text-4xl">Luxeva</p>
        <p className="mt-4 max-w-sm text-muted">
          Premium lifestyle essentials, beautifully presented with fast navigation, secure checkout, and a tailored shopping journey.
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">Shop</p>
        <div className="mt-4 space-y-3 text-sm">
          <Link to="/shop" className="block">All products</Link>
          <Link to="/shop?sort=best-selling" className="block">Best sellers</Link>
          <Link to="/shop?featured=true" className="block">Featured</Link>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">Company</p>
        <div className="mt-4 space-y-3 text-sm">
          <Link to="/about" className="block">About</Link>
          <Link to="/faq" className="block">FAQ</Link>
          <Link to="/contact" className="block">Contact</Link>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">Policy</p>
        <div className="mt-4 space-y-3 text-sm">
          <Link to="/terms" className="block">Terms</Link>
          <Link to="/privacy" className="block">Privacy</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

