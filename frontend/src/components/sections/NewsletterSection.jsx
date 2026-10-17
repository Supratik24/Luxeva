import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { endpoints } from "../../services/api";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(endpoints.content.newsletterSubscribe, {
        email: cleanEmail,
        source: "storefront_footer"
      });

      const data = res.data?.data || res.data || {};
      if (data.alreadySubscribed) {
        toast.success("You are already on the Luxeva list!");
      } else {
        toast.success("Welcome to the Luxeva edit. You're now subscribed!");
      }
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to subscribe at this moment. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-shell mt-24 mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-white px-8 py-14 text-ink shadow-card transition-colors dark:border-white/12 dark:bg-[#1e1e1e] dark:text-white dark:shadow-dark-card sm:px-12 lg:px-16">
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sand/80 blur-3xl opacity-80 dark:bg-white/[0.04] dark:opacity-100" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-sand/60 blur-2xl opacity-70 dark:bg-white/[0.03] dark:opacity-100" />
        </div>

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="eyebrow text-clay dark:text-white/70">Newsletter</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-snug text-ink dark:text-white sm:text-4xl">
              Get the inside edit.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-clay dark:text-white/70">
              New arrivals, private drops, flash sales — curated weekly, no noise.
            </p>
          </div>

          <div className="w-full max-w-sm lg:max-w-md">
            {subscribed ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold">You're on the list!</p>
                  <p className="opacity-90">Look out for our private drops and weekly curations.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubscribed(false)}
                  className="text-[11px] font-semibold underline hover:opacity-80 shrink-0"
                >
                  Add another
                </button>
              </div>
            ) : (
              <form
                className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-none lg:flex-col xl:flex-row"
                onSubmit={handleSubmit}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Type your email..."
                  required
                  disabled={loading}
                  className="input flex-1 border border-ink/15 bg-sand/50 text-ink placeholder:text-clay transition focus:border-ink/40 focus:bg-white focus:ring-2 focus:ring-ink/5 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus:border-white/40 dark:focus:bg-white/15 dark:focus:ring-white/5"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary shrink-0 px-7 py-3.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={15} />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
