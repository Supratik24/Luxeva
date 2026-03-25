import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "../../contexts/ShopContext";
import { currency } from "../../utils/format";

const QuickViewModal = () => {
  const { quickView, setQuickView, addToCart } = useShop();

  return (
    <AnimatePresence>
      {quickView ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass w-full max-w-4xl overflow-hidden rounded-[2rem] shadow-soft"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <img
                src={quickView.images?.[0]?.url || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"}
                alt={quickView.name}
                className="h-80 w-full object-cover md:h-full"
              />
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Quick view</p>
                    <h3 className="mt-2 font-display text-4xl">{quickView.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickView(null)}
                    className="rounded-full border border-ink/10 p-2 dark:border-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-muted">{quickView.shortDescription || quickView.description}</p>
                <p className="mt-6 text-2xl font-semibold">{currency(quickView.price)}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => addToCart(quickView)}
                    className="rounded-full bg-olive px-5 py-3 text-sm font-semibold text-white"
                  >
                    Add to cart
                  </button>
                  <Link
                    to={`/product/${quickView.slug}`}
                    onClick={() => setQuickView(null)}
                    className="rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
                  >
                    View full details
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default QuickViewModal;

