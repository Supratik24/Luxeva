import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";
import { currency } from "../../utils/format";

const AdminReportsPage = () => {
  const [analytics, setAnalytics] = useState({ revenue: 0, orders: 0, statusBreakdown: {} });

  useEffect(() => {
    api.get(endpoints.orders.adminAnalytics).then(({ data }) => setAnalytics(data.analytics || {}));
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl dark:text-white">Sales reports</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <p className="text-sm text-ink/55 dark:text-white/65">Total revenue</p>
          <p className="mt-3 text-3xl font-semibold dark:text-white">{currency(analytics.revenue)}</p>
        </div>
        <div className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <p className="text-sm text-ink/55 dark:text-white/65">Total orders</p>
          <p className="mt-3 text-3xl font-semibold dark:text-white">{analytics.orders || 0}</p>
        </div>
        <div className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <p className="text-sm text-ink/55 dark:text-white/65">Status mix</p>
          <p className="mt-3 text-sm dark:text-white/80">{Object.entries(analytics.statusBreakdown || {}).map(([key, value]) => `${key}: ${value}`).join(" | ")}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
