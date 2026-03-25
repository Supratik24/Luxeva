import Meta from "../components/ui/Meta";
import ProductCard from "../components/ui/ProductCard";
import { useShop } from "../contexts/ShopContext";

const WishlistPage = () => {
  const { wishlist } = useShop();

  return (
    <section className="section-shell py-12">
      <Meta title="Wishlist" description="Saved favorites and products you want to revisit." />
      <p className="eyebrow">Wishlist</p>
      <h1 className="mt-3 font-display text-5xl">Saved for later</h1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {wishlist.map((product) => (
          <ProductCard key={product._id} product={product} compact />
        ))}
      </div>
    </section>
  );
};

export default WishlistPage;
