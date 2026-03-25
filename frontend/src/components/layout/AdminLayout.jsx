import { BarChart3, Boxes, LayoutPanelTop, PackageSearch, ScrollText, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const items = [
  { label: "Overview", to: "/portal/admin", icon: BarChart3 },
  { label: "Products", to: "/portal/admin/products", icon: Boxes },
  { label: "Orders", to: "/portal/admin/orders", icon: PackageSearch },
  { label: "Users", to: "/portal/admin/users", icon: Users },
  { label: "Content", to: "/portal/admin/content", icon: LayoutPanelTop },
  { label: "Reports", to: "/portal/admin/reports", icon: ScrollText }
];

const AdminLayout = () => (
  <div className="min-h-screen bg-[#f6efe6] dark:bg-[#0d0d0d]">
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 p-4 lg:grid-cols-[280px_1fr]">
      <aside className="glass rounded-[2rem] p-6 shadow-soft">
        <p className="eyebrow">Private portal</p>
        <h1 className="mt-2 font-display text-4xl">Luxeva Admin</h1>
        <div className="mt-8 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/portal/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-ink text-white" : "hover:bg-ink/5 dark:hover:bg-white/5"
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </aside>
      <div className="glass rounded-[2rem] p-6 shadow-soft">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AdminLayout;
