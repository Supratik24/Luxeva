import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="mt-16 border-t border-black/5 dark:border-white/5">
    <div className="section-shell py-16">
      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Luxeva" className="h-10 w-auto object-contain" />
            <span className="font-display text-xl font-semibold">Luxeva</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-clay dark:text-white/40">
            Premium lifestyle essentials, beautifully presented with fast navigation and a tailored shopping journey.
          </p>
          <p className="mt-6 text-xs text-clay/60 dark:text-white/20">
            © {new Date().getFullYear()} Luxeva. All rights reserved.
          </p>
        </div>

        {/* Links */}
        {[
          {
            heading: "Shop",
            links: [
              { to: "/shop", label: "All products" },
              { to: "/shop?sort=best-selling", label: "Best sellers" },
              { to: "/shop?featured=true", label: "Featured" }
            ]
          },
          {
            heading: "Company",
            links: [
              { to: "/about", label: "About" },
              { to: "/faq", label: "FAQ" },
              { to: "/contact", label: "Contact" }
            ]
          },
          {
            heading: "Legal",
            links: [
              { to: "/terms", label: "Terms & Conditions" },
              { to: "/privacy", label: "Privacy Policy" }
            ]
          }
        ].map(({ heading, links }) => (
          <div key={heading}>
            <p className="eyebrow mb-4">{heading}</p>
            <div className="flex flex-col gap-3">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-clay transition hover:text-ink dark:text-white/40 dark:hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
