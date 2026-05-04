import { useEffect, useState } from "react";
import { ArrowRight, Box, Heart, ShieldCheck, Sparkles, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import SkeletonGrid from "../components/SkeletonGrid";
import { useAuth } from "../context/AuthContext";
import { cartAPI, customerAPI, productsAPI } from "../services/api";

const highlights = [
  {
    title: "Curated sellers",
    description: "Fresh products from active vendors with organized storefronts and live stock.",
    icon: ShieldCheck
  },
  {
    title: "Faster ordering",
    description: "A cleaner checkout experience with saved address flow and payment options.",
    icon: Truck
  },
  {
    title: "Better discovery",
    description: "Cards, spacing, and motion are tuned to make product browsing feel lighter and clearer.",
    icon: Sparkles
  }
];

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.list({ per_page: 8, page: 1, sort_by: "created_at", order: "desc" });
      if (result.success) {
        setFeatured(result.data.items);
      }
    } catch {
      toast.error("Failed to load featured products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = async (product) => {
    if (!user || user.role !== "customer") {
      toast.error("Login as customer to add cart items");
      return;
    }
    try {
      const result = await cartAPI.add({ product_id: product.id, quantity: 1 });
      if (result.success) toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add to cart");
    }
  };

  const addWishlist = async (product) => {
    if (!user || user.role !== "customer") {
      toast.error("Login as customer to use wishlist");
      return;
    }
    try {
      const result = await customerAPI.addWishlist({ product_id: product.id });
      if (result.success) toast.success("Added to wishlist");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add to wishlist");
    }
  };

  return (
    <div className="space-y-8 section-fade">
      <section className="hero-mesh rounded-[40px] p-6 text-white shadow-soft sm:p-8 lg:p-10">
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
              Refreshed Marketplace Experience
            </div>

            <div className="space-y-4">
              <h1 className="brand-font max-w-3xl text-4xl font-bold leading-tight sm:text-5xl xl:text-6xl">
                A cleaner shopping layout with richer motion, softer colors, and faster product discovery.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                Browse the newest products, enjoy a more polished visual flow, and move from discovery to checkout with less clutter.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Shop Products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/18"
              >
                Create Account
              </Link>
              <Link
                to="/register/seller"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-400/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-400/22"
              >
                Seller Register
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Latest Drop</p>
                <p className="mt-2 text-2xl font-bold">{featured.length || 8}</p>
                <p className="mt-1 text-sm text-white/70">fresh featured products</p>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Checkout</p>
                <p className="mt-2 text-2xl font-bold">4</p>
                <p className="mt-1 text-sm text-white/70">payment methods available</p>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Design</p>
                <p className="mt-2 text-2xl font-bold">New</p>
                <p className="mt-1 text-sm text-white/70">layout and motion refresh</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="floating-panel rounded-[30px] border border-white/15 bg-white/12 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white/15 p-3 text-white">
                  <Box className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Storefront Flow</p>
                  <p className="mt-1 text-xl font-bold">Product cards now feel more editorial and more readable.</p>
                </div>
              </div>
            </div>

            <div className="floating-panel floating-panel-delay ml-auto max-w-md rounded-[30px] border border-white/15 bg-slate-950/25 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-400/20 p-3 text-amber-100">
                  <Heart className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Customer Focus</p>
                  <p className="mt-1 text-lg font-bold">Customer and seller registration are now separated, so each flow has its own page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="spotlight-card p-5">
              <div className="inline-flex rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="brand-font mt-4 text-2xl font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Featured Now</p>
            <h2 className="brand-font mt-2 text-3xl font-bold">Latest products on the marketplace</h2>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300">
            View all products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onAddToWishlist={addWishlist}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
