import { ArrowRight, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const footerLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/register", label: "Customer Signup" },
  { to: "/register/seller", label: "Seller Signup" }
];

const Footer = () => {
  return (
    <footer className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1450px]">
        <div className="glass-card rounded-[34px] px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr,0.85fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <BrandMark className="h-14 w-14 bg-[color:var(--surface-inverse)] text-white shadow-lg shadow-black/10 dark:text-[color:var(--surface-inverse)]" />
                <div>
                  <p className="brand-font text-2xl font-bold text-[color:var(--text-main)]">LionMart</p>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
                    Fast Multi-Vendor Commerce
                  </p>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-soft)]">
                LionMart gives your marketplace a faster browsing flow, clearer dashboards, and a premium identity built around warm gold tones and cleaner spacing.
              </p>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--accent-soft)] px-4 py-2 font-semibold text-[color:var(--text-main)]">
                  <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
                  Premium visual refresh
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--accent-soft)] px-4 py-2 font-semibold text-[color:var(--text-main)]">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
                  Customer, seller, and admin ready
                </span>
              </div>
            </div>

            <div>
              <p className="eyebrow">Quick Paths</p>
              <div className="mt-4 grid gap-3">
                {footerLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between rounded-[24px] border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--text-main)] transition hover:-translate-y-0.5 hover:border-[color:var(--card-border-strong)]"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-[color:var(--brand)]" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="hero-mesh rounded-[30px] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Sell With Us</p>
              <h3 className="brand-font mt-3 text-3xl font-bold">Bring your store to LionMart.</h3>
              <p className="mt-3 text-sm leading-7 text-white/78">
                Apply as a seller, get approved, and manage products, stock, and orders from one polished control room.
              </p>
              <Link to="/register/seller" className="button-ghost mt-5 inline-flex items-center gap-2">
                <Store className="h-4 w-4" />
                Open Seller Registration
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-[color:var(--card-border)] pt-5 text-sm text-[color:var(--text-muted)]">
            © {new Date().getFullYear()} LionMart. Built for a sharper marketplace experience.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
