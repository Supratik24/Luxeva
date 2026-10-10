import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  const load = () => api.get(endpoints.orders.adminOrders).then(({ data }) => setOrders(data.orders || []));

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="font-display text-4xl dark:text-white">Orders</h1>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-[1.8rem] border border-ink/10 bg-white p-5 shadow-card dark:border-white/12 dark:bg-[#222222]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold dark:text-white">{order.orderNumber}</p>
                <p className="text-sm text-ink/55 dark:text-white/60">{order.customer?.name} | {shortDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold dark:text-white">{currency(order.total)}</p>
                <select
                  value={order.status}
                  onChange={async (e) => {
                    await api.patch(endpoints.orders.updateStatus(order._id), { status: e.target.value });
                    await load();
                  }}
                  className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm outline-none dark:border-white/15 dark:bg-[#2a2d3a] dark:text-white"
                >
                  {["placed", "packed", "shipped", "delivered", "cancelled"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
