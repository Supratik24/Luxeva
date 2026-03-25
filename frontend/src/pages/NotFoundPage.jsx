import { Link } from "react-router-dom";
import Meta from "../components/ui/Meta";

const NotFoundPage = () => (
  <section className="section-shell flex min-h-[60vh] items-center py-16">
    <Meta title="404" description="Page not found." />
    <div className="glass w-full rounded-[2rem] p-10 text-center shadow-soft">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-6xl">Page not found</h1>
      <p className="mt-4 text-muted">The page you were looking for has moved, expired, or never existed.</p>
      <Link to="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
        Return home
      </Link>
    </div>
  </section>
);

export default NotFoundPage;
