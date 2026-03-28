import { ChevronDown, Heart, LayoutDashboard, Menu, PackageCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useShop } from "../../contexts/ShopContext";
import { cls } from "../../utils/format";
import BrandMark from "../ui/BrandMark";
import SearchBar from "../ui/SearchBar";
import ThemeToggle from "../ui/ThemeToggle";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cart, wishlist } = useShop();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-mist/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#101010]/85">
      <div className="section-shell flex min-h-[86px] items-center gap-4">
        <Link to="/" className="mr-2 flex items-center gap-3">
          <BrandMark className="h-12 w-12 shrink-0" />
          <div>
            <p className="font-display text-3xl leading-none">Luxeva</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-ink/50 dark:text-white/45">Curated Commerce</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setAccountOpen(false)}
              className={({ isActive }) =>
                cls("text-sm font-semibold transition hover:text-olive", isActive && "text-olive")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SearchBar />
          <ThemeToggle />
          <Link to="/wishlist" className="glass relative hidden rounded-full p-3 md:block">
            <Heart size={18} />
            <span className="absolute -right-1 -top-1 rounded-full bg-clay px-1.5 text-[10px] font-bold text-white">
              {wishlist.length}
            </span>
          </Link>
          <Link to="/cart" className="glass relative rounded-full p-3">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 rounded-full bg-olive px-1.5 text-[10px] font-bold text-white">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </Link>
          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="glass flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
              >
                <UserRound size={16} />
                {user.name?.split(" ")[0]}
                <ChevronDown size={16} className={cls("transition", accountOpen && "rotate-180")} />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-64 rounded-[1.6rem] border border-white/30 bg-white/95 p-3 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#111111]/95">
                  <p className="px-3 py-2 text-xs uppercase tracking-[0.24em] text-ink/45 dark:text-white/45">
                    Account
                  </p>
                  <div className="space-y-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-ink/5 dark:hover:bg-white/5"
                    >
                      <UserRound size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard?tab=orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-ink/5 dark:hover:bg-white/5"
                    >
                      <PackageCheck size={16} />
                      Orders
                    </Link>
                    <Link
                      to="/dashboard?tab=wishlist"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-ink/5 dark:hover:bg-white/5"
                    >
                      <Heart size={16} />
                      Wishlist
                    </Link>
                    {user.role === "admin" ? (
                      <Link
                        to="/portal/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition hover:bg-ink/5 dark:hover:bg-white/5"
                      >
                        <LayoutDashboard size={16} />
                        Admin panel
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition hover:bg-ink/5 dark:hover:bg-white/5"
                    >
                      <X size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="hidden rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white md:block">
              Login
            </Link>
          )}
          <button type="button" onClick={() => setOpen((value) => !value)} className="glass rounded-full p-3 lg:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="section-shell pb-4 lg:hidden">
          <div className="glass space-y-3 rounded-[1.6rem] p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                {item.label}
              </NavLink>
            ))}
            {!user ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white"
              >
                Login
              </Link>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold">
                  Dashboard
                </Link>
                <Link
                  to="/dashboard?tab=orders"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold"
                >
                  Orders
                </Link>
                <Link
                  to="/dashboard?tab=wishlist"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold"
                >
                  Wishlist
                </Link>
                {user.role === "admin" ? (
                  <Link
                    to="/portal/admin"
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    Admin panel
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
