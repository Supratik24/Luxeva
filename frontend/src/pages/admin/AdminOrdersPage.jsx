import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";
import { currency, shortDate } from "../../utils/format";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  const load = () => api.get(endpoints.orders.adminOrders).then(({ data }) => setOrders(data.orders || []));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">{order.customer?.name} | {shortDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{currency(order.total)}</p>
                <select
                  value={order.status}
                  onChange={async (e) => {
                    await api.patch(endpoints.orders.updateStatus(order._id), { status: e.target.value });
                    await load();
                  }}
                  className="rounded-full border border-ink/10 bg-transparent px-4 py-2 text-sm outline-none dark:border-white/10"
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
