import { Heart, LayoutDashboard, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useShop } from "../../contexts/ShopContext";
import { cls } from "../../utils/format";
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
  const { user, logout } = useAuth();
  const { cart, wishlist } = useShop();

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-mist/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#101010]/85">
      <div className="section-shell flex min-h-[86px] items-center gap-4">
        <Link to="/" className="mr-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white dark:bg-sand dark:text-ink">
            LX
          </div>
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
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/dashboard" className="glass flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
                <UserRound size={16} />
                {user.name?.split(" ")[0]}
              </Link>
              {user.role === "admin" ? (
                <Link to="/portal/admin" className="glass flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
              ) : null}
              <button type="button" onClick={logout} className="text-sm font-semibold text-ink/70 dark:text-white/70">
                Logout
              </button>
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
              <NavLink key={item.to} to={item.to} className="block rounded-2xl px-4 py-3 text-sm font-semibold">
                {item.label}
              </NavLink>
            ))}
            <Link to="/dashboard" className="block rounded-2xl px-4 py-3 text-sm font-semibold">
              Dashboard
            </Link>
            {!user ? (
              <Link to="/login" className="block rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
                Login
              </Link>
            ) : (
              <button type="button" onClick={logout} className="w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold">
                Logout
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;

