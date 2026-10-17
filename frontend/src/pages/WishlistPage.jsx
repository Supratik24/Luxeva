import Meta from "../components/ui/Meta";
import WishlistSection from "../components/wishlist/WishlistSection";

const WishlistPage = () => {
  return (
    <section className="section-shell py-10 lg:py-14">
      <Meta
        title="My Wishlist"
        description="Saved favorites organized by clothing, electronics, footwear, and home collections."
      />
      <div className="mb-8">
        <span className="eyebrow text-clay dark:text-white/70">Personal Collection</span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-ink dark:text-white">
          Saved For Later
        </h1>
        <p className="mt-2 text-sm text-clay dark:text-white/70 max-w-xl">
          Your saved items organized into separate collections like clothing, electronics, and lifestyle essentials.
        </p>
      </div>

      <WishlistSection inDashboard={false} />
    </section>
  );
};

export default WishlistPage;
