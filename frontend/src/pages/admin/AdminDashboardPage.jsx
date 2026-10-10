import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import api, { endpoints } from "../../services/api";
import { currency } from "../../utils/format";

const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState({ revenue: 0, orders: 0, averageOrderValue: 0, monthlySales: [] });
  const [lowStock, setLowStock] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(endpoints.orders.adminAnalytics),
      api.get(endpoints.catalog.lowStock),
      api.get(endpoints.notifications.admin)
    ]).then(([analyticsRes, stockRes, notificationsRes]) => {
      setAnalytics(analyticsRes.data.analytics || {});
      setLowStock(stockRes.data.products || []);
      setNotifications(notificationsRes.data.notifications || []);
    });
  }, []);

  return (
    <div>
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-3 font-display text-5xl dark:text-white">Operations overview</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Revenue", value: currency(analytics.revenue) },
          { label: "Orders", value: analytics.orders || 0 },
          { label: "AOV", value: currency(analytics.averageOrderValue) }
        ].map((card) => (
          <div key={card.label} className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <p className="text-sm text-ink/55 dark:text-white/65">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <p className="text-sm font-semibold dark:text-white">Sales chart</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlySales || []}>
                <defs>
                  <linearGradient id="sales" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="month" tick={{ fill: "currentColor", opacity: 0.6 }} />
                <Tooltip />
                <Area dataKey="sales" stroke="#ffffff" fill="url(#sales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
          <p className="text-sm font-semibold dark:text-white">Low-stock alerts</p>
          <div className="mt-4 space-y-3">
            {lowStock.map((product) => (
              <div key={product._id} className="rounded-[1.3rem] bg-ink/5 p-4 dark:bg-white/8">
                <p className="font-semibold dark:text-white">{product.name}</p>
                <p className="text-sm text-ink/55 dark:text-white/65">SKU: {product.sku} | {product.stock} left</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
        <p className="text-sm font-semibold dark:text-white">Admin notifications</p>
        <div className="mt-4 space-y-3">
          {notifications.map((notification) => (
            <div key={notification._id} className="rounded-[1.3rem] bg-ink/5 p-4 dark:bg-white/8">
              <p className="font-semibold dark:text-white">{notification.title}</p>
              <p className="text-sm text-ink/55 dark:text-white/65">{notification.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
