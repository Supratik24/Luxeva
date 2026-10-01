import { BarChart3, Boxes, Image, LayoutPanelTop, PackageSearch, ScrollText, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const items = [
  { label: "Overview", to: "/portal/admin", icon: BarChart3 },
  { label: "Products", to: "/portal/admin/products", icon: Boxes },
  { label: "Orders", to: "/portal/admin/orders", icon: PackageSearch },
  { label: "Users", to: "/portal/admin/users", icon: Users },
  { label: "Content", to: "/portal/admin/content", icon: LayoutPanelTop },
  { label: "Media", to: "/portal/admin/media", icon: Image },
  { label: "Reports", to: "/portal/admin/reports", icon: ScrollText }
];

const AdminLayout = () => (
  <div className="min-h-screen bg-sand dark:bg-[#0A0A0A]">
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-0 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-ink/5 bg-white px-4 py-8 dark:border-white/5 dark:bg-[#0f0f0f] lg:block">
        <div className="px-2 mb-8">
          <p className="eyebrow mb-1">Private Portal</p>
          <h1 className="font-display text-2xl font-semibold">Luxeva Admin</h1>
        </div>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/portal/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-ink text-white dark:bg-white dark:text-ink"
                      : "text-clay hover:bg-ink/5 hover:text-ink dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="min-h-screen bg-sand p-6 dark:bg-[#0A0A0A] lg:p-10">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
