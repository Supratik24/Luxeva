import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import Meta from "../components/ui/Meta";
import { mockContent, useLocalPreviewData } from "../data/mockStorefront";
import api, { endpoints } from "../services/api";

const FAQPage = () => {
  const [faq, setFaq] = useState([]);

  useEffect(() => {
    if (useLocalPreviewData) {
      setFaq(mockContent.faq);
      return;
    }

    api.get(endpoints.content.home).then(({ data }) => setFaq(data.faq || [])).catch(() => setFaq(mockContent.faq));
  }, []);

  return (
    <section className="section-shell py-12">
      <Meta title="FAQ" description="Frequently asked questions about shipping, orders, and support." />
      <p className="eyebrow">FAQ</p>
      <h1 className="mt-3 font-display text-5xl">Answers that keep things moving</h1>
      <div className="mt-10 space-y-4">
        {faq.map((item, index) => (
          <details key={index} className="glass rounded-[1.8rem] p-5 shadow-soft">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
              {item.question}
              <ChevronDown size={18} />
            </summary>
            <p className="mt-4 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FAQPage;
