import { useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Globe, Store, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sellerHighlights = [
  "Submit your seller profile and business details",
  "Wait for admin approval before first login",
  "Manage products, inventory, and order updates after approval"
];

const SellerRegisterPage = () => {
  const { registerSeller } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    company_phone: "",
    company_address: "",
    company_website: "",
    business_description: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const result = await registerSeller(form);
      if (result.success) {
        toast.success(result.message || "Seller application submitted");
        navigate("/login");
      } else {
        toast.error(result.message || "Could not submit seller application");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit seller application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl section-fade">
      <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <section className="hero-mesh rounded-[36px] p-7 text-white shadow-soft sm:p-8">
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur">
                Seller Registration
              </div>
              <h1 className="brand-font mt-5 text-4xl font-bold leading-tight">Open your storefront with a dedicated seller application page.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/80">
                Share your business details, wait for approval, then manage products, orders, and performance from the seller dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="inline-flex rounded-2xl bg-white/12 p-3 text-white">
                  <Store className="h-5 w-5" />
                </span>
                <p className="mt-4 text-lg font-bold">Store profile</p>
                <p className="mt-2 text-sm leading-6 text-white/75">Add company name, address, phone, and a short business description.</p>
              </div>

              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <span className="inline-flex rounded-2xl bg-amber-400/18 p-3 text-amber-100">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <p className="mt-4 text-lg font-bold">Approval flow</p>
                <p className="mt-2 text-sm leading-6 text-white/75">An admin reviews the application before the seller account becomes active.</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-white/12 p-3 text-white">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <p className="text-lg font-bold">Seller onboarding</p>
              </div>
              <div className="mt-4 space-y-3">
                {sellerHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <Truck className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[36px] p-7 shadow-soft sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Apply As Seller</p>
            <h2 className="brand-font mt-3 text-3xl font-bold">Become a Seller</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Fill in your seller details below. This page is separate from the customer register page.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Contact Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="soft-input"
                  placeholder="Owner or manager name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Login Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="soft-input"
                  placeholder="seller@company.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="soft-input"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Company Phone</label>
                <input
                  required
                  value={form.company_phone}
                  onChange={(event) => updateField("company_phone", event.target.value)}
                  className="soft-input"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Company Name</label>
              <input
                required
                value={form.company_name}
                onChange={(event) => updateField("company_name", event.target.value)}
                className="soft-input"
                placeholder="Your registered business name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Company Address</label>
              <textarea
                required
                rows={3}
                value={form.company_address}
                onChange={(event) => updateField("company_address", event.target.value)}
                className="soft-textarea"
                placeholder="Head office or warehouse address"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Company Website</label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.company_website}
                  onChange={(event) => updateField("company_website", event.target.value)}
                  className="soft-input pl-11"
                  placeholder="Optional website or store URL"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Business Description</label>
              <textarea
                required
                rows={5}
                value={form.business_description}
                onChange={(event) => updateField("business_description", event.target.value)}
                className="soft-textarea"
                placeholder="Tell the admin what you sell, your product categories, and your business background"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {loading ? "Submitting application..." : "Submit Seller Application"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Already approved?{" "}
            <Link to="/login" className="font-semibold text-teal-700 dark:text-teal-300">
              Login here
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
