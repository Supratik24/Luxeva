import { Heart, LayoutDashboard, Menu, PackageCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useShop } from "../../contexts/ShopContext";
import { cls } from "../../utils/format";
import SearchBar from "../ui/SearchBar";
import ThemeToggle from "../ui/ThemeToggle";

const navItems = [
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cart, wishlist } = useShop();

  const cartCount = cart?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!accountOpen) return;
    const handler = () => setAccountOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [accountOpen]);

  return (
    <header
      className={cls(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-black/5 bg-white/90 backdrop-blur-xl shadow-soft dark:border-white/5 dark:bg-[#0A0A0A]/90"
          : "bg-transparent"
      )}
    >
      <div className="section-shell flex h-[72px] items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white dark:bg-white dark:text-ink">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">Luxeva</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cls(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-ink/5 text-ink dark:bg-white/10 dark:text-white"
                    : "text-clay hover:bg-ink/5 hover:text-ink dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <ThemeToggle />

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative hidden rounded-full p-2.5 transition hover:bg-ink/5 dark:hover:bg-white/5 md:flex"
          >
            <Heart size={19} strokeWidth={1.7} />
            {wishlist?.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white dark:bg-white dark:text-ink">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex rounded-full p-2.5 transition hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            {cartCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white dark:bg-white dark:text-ink">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {isAuthenticated ? (
            <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition hover:opacity-80 dark:bg-white dark:text-ink"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <UserRound size={16} />
                )}
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-float dark:border-white/8 dark:bg-[#111]">
                  <div className="border-b border-black/5 px-4 py-3 dark:border-white/5">
                    <p className="text-xs font-medium text-clay dark:text-white/40">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">{user?.name || "User"}</p>
                  </div>
                  <div className="p-1.5">
                    {[
                      { to: "/dashboard", icon: UserRound, label: "Profile" },
                      { to: "/dashboard?tab=orders", icon: PackageCheck, label: "Orders" },
                      { to: "/dashboard?tab=wishlist", icon: Heart, label: "Wishlist" },
                      ...(user?.role === "admin" ? [{ to: "/portal/admin", icon: LayoutDashboard, label: "Admin Panel" }] : [])
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-ink/5 dark:hover:bg-white/5"
                      >
                        <Icon size={15} className="text-clay dark:text-white/40" />
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-black/5 dark:border-white/5" />
                    <button
                      type="button"
                      onClick={() => { setAccountOpen(false); logout(); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <X size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80 dark:bg-white dark:text-ink md:inline-flex"
            >
              Sign in
            </Link>
          )}

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2.5 transition hover:bg-ink/5 dark:hover:bg-white/5 lg:hidden"
          >
            {open ? <X size={20} strokeWidth={1.7} /> : <Menu size={20} strokeWidth={1.7} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-black/5 bg-white/95 backdrop-blur-xl dark:border-white/5 dark:bg-[#0A0A0A]/95 lg:hidden">
          <div className="section-shell py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cls(
                    "rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive ? "bg-ink/5 text-ink dark:bg-white/10" : "hover:bg-ink/5 dark:hover:bg-white/5"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-black/5 pt-3 dark:border-white/5">
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-ink"
                >
                  Sign in
                </Link>
              ) : (
                <>
                  {[
                    { to: "/dashboard", label: "Profile" },
                    { to: "/dashboard?tab=orders", label: "Orders" },
                    { to: "/dashboard?tab=wishlist", label: "Wishlist" },
                    { to: "/wishlist", label: "Saved items" },
                    ...(user?.role === "admin" ? [{ to: "/portal/admin", label: "Admin Panel" }] : [])
                  ].map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-ink/5 dark:hover:bg-white/5"
                    >
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setOpen(false); logout(); }}
                    className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
