import { useEffect, useState } from "react";
import Meta from "../components/ui/Meta";
import api, { endpoints } from "../services/api";

const PolicyPage = ({ slug, title }) => {
  const [page, setPage] = useState(null);

  useEffect(() => {
    api.get(endpoints.content.page(slug)).then(({ data }) => setPage(data.page)).catch(() => undefined);
  }, [slug]);

  return (
    <section className="section-shell py-12">
      <Meta title={title} description={`${title} and policy information for Luxeva.`} />
      <div className="glass rounded-[2rem] p-8 shadow-soft sm:p-12">
        <p className="eyebrow">{title}</p>
        <h1 className="mt-3 font-display text-5xl">{page?.title || title}</h1>
        <div className="mt-8 space-y-4 text-base leading-8 text-ink/70 dark:text-white/70">
          {(page?.items || [
            {
              heading: "Service terms",
              content: "Orders, delivery estimates, payment handling, and account usage are governed by platform policies."
            },
            {
              heading: "Privacy commitments",
              content: "Customer data is handled securely, and authenticated routes are protected by role-aware backend authorization."
            }
          ]).map((item, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold">{item.heading}</h2>
              <p className="mt-2">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PolicyPage;

