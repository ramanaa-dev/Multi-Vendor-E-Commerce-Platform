import { useEffect, useState } from "react";
import { LogOut, Menu, ShoppingCart, Sparkles, Store, UserRound, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const commonLinks = [{ to: "/products", label: "Products" }];

  const roleLinks = {
    customer: [
      { to: "/cart", label: "Cart", icon: <ShoppingCart size={16} /> },
      { to: "/dashboard/customer", label: "Dashboard" },
      { to: "/profile", label: "Profile" }
    ],
    seller: [
      { to: "/dashboard/seller", label: "Seller Dashboard" },
      { to: "/profile", label: "Profile" }
    ],
    admin: [
      { to: "/dashboard/admin", label: "Admin Dashboard" },
      { to: "/profile", label: "Profile" }
    ]
  };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const renderLink = (link) => (
    <NavLink
      key={link.to}
      to={link.to}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-[color:var(--surface-inverse)] text-white shadow-lg shadow-black/10 dark:text-[color:var(--surface-inverse)]"
            : "text-[color:var(--text-main)] hover:bg-[color:var(--card-bg-strong)]"
        }`
      }
    >
      {link.icon}
      {link.label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <nav className="nav-shell mx-auto flex w-full max-w-[1450px] items-center justify-between rounded-[30px] px-4 py-3 sm:px-5">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark className="h-12 w-12 bg-[color:var(--surface-inverse)] text-white shadow-lg shadow-black/10 dark:text-[color:var(--surface-inverse)]" />
          <div>
            <p className="brand-font text-2xl font-bold text-[color:var(--text-main)]">LionMart</p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">Savanna Commerce</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 xl:flex">
          <div className="flex items-center gap-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--accent-soft)] px-2 py-1">
            {commonLinks.map(renderLink)}
            {!isAuthenticated && renderLink({ to: "/login", label: "Login" })}
            {!isAuthenticated && renderLink({ to: "/register", label: "Register" })}
            {isAuthenticated && roleLinks[user?.role]?.map(renderLink)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {!isAuthenticated && (
              <Link to="/register/seller" className="button-dark">
                <Store className="h-4 w-4" />
                Sell on LionMart
              </Link>
            )}
            {isAuthenticated && (
              <div className="hidden items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-main)] md:flex">
                <UserRound className="h-4 w-4 text-[color:var(--brand)]" />
                {user?.name || user?.role}
              </div>
            )}
          </div>

          <ThemeToggle />

          {isAuthenticated && (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="button-secondary hidden px-4 md:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="icon-button lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass-card mx-auto mt-3 max-w-[1450px] rounded-[30px] p-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {!isAuthenticated && (
              <div className="hero-mesh rounded-[26px] p-5 text-white">
                <div className="flex items-center gap-3">
                  <BrandMark className="h-12 w-12 bg-white/15 text-white" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Premium Refresh</p>
                    <p className="brand-font text-2xl font-bold">LionMart</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/78">
                  Browse faster, register cleaner, and open your storefront with the new lion identity.
                </p>
              </div>
            )}

            {commonLinks.map(renderLink)}
            {!isAuthenticated && renderLink({ to: "/login", label: "Login" })}
            {!isAuthenticated && renderLink({ to: "/register", label: "Register" })}
            {!isAuthenticated && renderLink({ to: "/register/seller", label: "Seller Register" })}
            {isAuthenticated && roleLinks[user?.role]?.map(renderLink)}

            {!isAuthenticated && (
              <Link to="/register/seller" className="button-dark mt-2">
                <Sparkles className="h-4 w-4" />
                Sell on LionMart
              </Link>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  navigate("/");
                }}
                className="button-secondary mt-2 justify-start"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
