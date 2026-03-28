import { useEffect, useState } from "react";
import Meta from "../components/ui/Meta";
import { getMockPage, useLocalPreviewData } from "../data/mockStorefront";
import api, { endpoints } from "../services/api";

const AboutPage = () => {
  const [page, setPage] = useState(null);

  useEffect(() => {
    if (useLocalPreviewData) {
      setPage(getMockPage("about"));
      return;
    }

    api.get(endpoints.content.page("about")).then(({ data }) => setPage(data.page)).catch(() => setPage(getMockPage("about")));
  }, []);

  return (
    <section className="section-shell py-12">
      <Meta title="About" description="Learn about the Luxeva brand and platform." />
      <div className="glass rounded-[2rem] p-8 shadow-soft sm:p-12">
        <p className="eyebrow">About us</p>
        <h1 className="mt-3 font-display text-5xl">{page?.title || "Built for premium, modern commerce"}</h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-ink/70 dark:text-white/70">
          {page?.subtitle ||
            "Luxeva pairs a refined shopping interface with a scalable microservices backend, secure authentication, Redis-backed performance, and an admin experience designed for real operations."}
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            "Responsive, premium design language",
            "Redis caching plus event-driven notifications",
            "Secure role-based admin control"
          ].map((item) => (
            <div key={item} className="rounded-[1.6rem] border border-ink/10 p-5 dark:border-white/10">
              <p className="font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
