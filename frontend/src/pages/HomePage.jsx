import { useEffect, useState } from "react";
import api, { endpoints } from "../services/api";
import Meta from "../components/ui/Meta";
import HeroSection from "../components/sections/HeroSection";
import CategoryStrip from "../components/sections/CategoryStrip";
import ProductShowcase from "../components/sections/ProductShowcase";
import TestimonialsSection from "../components/sections/TestimonialsSection";
import NewsletterSection from "../components/sections/NewsletterSection";
import { getMockMeta, getMockProducts, mockContent, useLocalPreviewData } from "../data/mockStorefront";

const HomePage = () => {
  const [content, setContent] = useState({ banners: [], testimonials: [] });
  const [catalog, setCatalog] = useState({ categories: [], featuredProducts: [] });
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useLocalPreviewData) {
      setContent(mockContent);
      setCatalog(getMockMeta());
      setTrending(getMockProducts({ trending: true }).slice(0, 4));
      setLoading(false);
      return;
    }

    Promise.all([
      api.get(endpoints.content.home),
      api.get(endpoints.catalog.meta),
      api.get(endpoints.catalog.products, { params: { trending: true, limit: 4 } })
    ])
      .then(([contentRes, metaRes, trendingRes]) => {
        setContent(contentRes.data);
        setCatalog(metaRes.data);
        setTrending(trendingRes.data.products || []);
      })
      .catch(() => {
        setContent(mockContent);
        setCatalog(getMockMeta());
        setTrending(getMockProducts({ trending: true }).slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Meta title="Premium eCommerce" description="Modern full-stack shopping experience with a premium curated storefront." />
      <HeroSection banners={content.banners} />
      <CategoryStrip categories={catalog.categories.slice(0, 4)} />
      <ProductShowcase
        title="Featured finds with rich detail and elevated finishing touches"
        eyebrow="Featured products"
        products={catalog.featuredProducts}
        loading={loading}
      />
      <ProductShowcase
        title="Trending right now"
        eyebrow="Trending products"
        products={trending}
        loading={loading}
      />
      <TestimonialsSection testimonials={content.testimonials.slice(0, 3)} />
      <NewsletterSection />
    </>
  );
};

export default HomePage;
