import { ArrowLeft, BarChart3, Boxes, Image, LayoutPanelTop, PackageSearch, ScrollText, Users } from "lucide-react";
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
  <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0D0F14]">
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-0 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-ink/8 bg-white px-4 py-8 dark:border-white/10 dark:bg-[#111318] lg:flex lg:flex-col">
        <div className="px-2 mb-8">
          <p className="eyebrow mb-1">Private Portal</p>
          <h1 className="font-display text-2xl font-semibold dark:text-white">Luxeva Admin</h1>
        </div>
        <nav className="space-y-0.5 flex-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-clay hover:bg-ink/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Storefront
          </NavLink>

          <div className="mb-2 px-3 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-clay/60 dark:text-white/30">Navigation</p>
          </div>

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
                      ? "bg-ink text-white dark:bg-[#5C6BC0] dark:text-white shadow-sm"
                      : "text-clay hover:bg-ink/5 hover:text-ink dark:text-white/65 dark:hover:bg-white/8 dark:hover:text-white"
                  }`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 pt-4 mt-4 border-t border-ink/5 dark:border-white/8">
          <p className="text-[10px] text-clay/50 dark:text-white/25">Luxeva Admin Portal</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen bg-[#F5F5F0] p-6 dark:bg-[#0D0F14] lg:p-10">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
