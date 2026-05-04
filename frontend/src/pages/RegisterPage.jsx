import { useState } from "react";
import { CheckCircle2, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const perks = [
  "Faster checkout and saved shopping flow",
  "Wishlist and order history in one dashboard",
  "Cleaner browsing experience with updated product cards"
];

const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const result = await register(form);
      if (result.success) {
        toast.success(result.message || "Registration successful");
        navigate("/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl section-fade">
      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="hero-mesh rounded-[36px] p-7 text-white shadow-soft sm:p-8">
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
                Customer Registration
              </div>
              <h1 className="brand-font mt-5 text-4xl font-bold leading-tight">Create your shopping account with the new cleaner layout.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
                Register as a customer to browse products, build your wishlist, place orders, and track payments and delivery from one dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="inline-flex rounded-2xl bg-white/12 p-3 text-white">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <p className="mt-4 text-lg font-bold">Built for buyers</p>
                <p className="mt-2 text-sm leading-6 text-white/75">This page is only for normal customer accounts and shopping access.</p>
              </div>

              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="inline-flex rounded-2xl bg-amber-400/18 p-3 text-amber-100">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <p className="mt-4 text-lg font-bold">Simple onboarding</p>
                <p className="mt-2 text-sm leading-6 text-white/75">Just name, email, and password to start using the marketplace.</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-white/12 p-3 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="text-lg font-bold">What you get after signup</p>
              </div>
              <div className="mt-4 space-y-3">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[36px] p-7 shadow-soft sm:p-8">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Join Now</p>
            <h2 className="brand-font mt-3 text-3xl font-bold">Create Customer Account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Start with your customer profile and sign in once the account is created.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="soft-input"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="soft-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="soft-input"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-700 dark:text-teal-300">
              Login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
