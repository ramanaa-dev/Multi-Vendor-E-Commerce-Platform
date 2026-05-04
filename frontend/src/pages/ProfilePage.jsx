import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Mail, Pencil, ShieldCheck, Trash2, User2 } from "lucide-react";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { customerAPI, sellerAPI } from "../services/api";

const ProfilePage = () => {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [profile, setProfile] = useState({ name: "", email: "", role: "", status: "" });
  const [sellerProducts, setSellerProducts] = useState([]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await customerAPI.profile();
      if (result.success) {
        setProfile(result.data);

        if (result.data.role === "seller") {
          try {
            const productsResult = await sellerAPI.products({ page: 1, per_page: 50 });
            if (productsResult.success) {
              setSellerProducts(productsResult.data.items);
            }
          } catch {
            setSellerProducts([]);
          }
        }
      }
    } catch {
      toast.error("Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const result = await customerAPI.updateProfile({ name: profile.name, email: profile.email });
      if (result.success) {
        setProfile(result.data);
        setUser(result.data);
        toast.success("Profile updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const deleteSellerProduct = async (productId) => {
    if (!window.confirm("Delete this product from your seller profile?")) return;

    try {
      setDeletingId(productId);
      const result = await sellerAPI.deleteProduct(productId);
      if (result.success) {
        setSellerProducts((prev) => prev.filter((item) => item.id !== productId));
        toast.success("Product deleted");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete product");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loader text="Loading profile..." />;

  return (
    <div className="mx-auto max-w-6xl section-fade">
      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="glass-card rounded-[34px] p-7 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Account Profile</p>
          <h1 className="brand-font mt-3 text-3xl font-bold">Manage your information</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Update your account details here. Sellers also get product controls directly on this page.
          </p>

          <form onSubmit={saveProfile} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">Name</label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  className="soft-input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                  className="soft-input pl-11"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-950/35">
                <p className="text-slate-500 dark:text-slate-400">Role</p>
                <p className="mt-1 font-bold uppercase">{profile.role}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-950/35">
                <p className="text-slate-500 dark:text-slate-400">Status</p>
                <p className="mt-1 font-bold uppercase">{profile.status}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          {profile.role === "seller" && (
            <>
              <div className="glass-card rounded-[34px] p-7 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Seller Details</p>
                    <h2 className="brand-font mt-2 text-2xl font-bold">
                      {profile.seller_profile?.company_name || "Seller Profile"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {profile.seller_profile?.business_description || "No business description added yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-950/35">
                    <p className="text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="mt-1 font-semibold">{profile.seller_profile?.company_phone || "Not provided"}</p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-950/35">
                    <p className="text-slate-500 dark:text-slate-400">Website</p>
                    <p className="mt-1 font-semibold break-all">{profile.seller_profile?.company_website || "Not provided"}</p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-950/35 sm:col-span-2">
                    <p className="text-slate-500 dark:text-slate-400">Address</p>
                    <p className="mt-1 font-semibold">{profile.seller_profile?.company_address || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[34px] p-7 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300">Seller Products</p>
                    <h2 className="brand-font mt-2 text-2xl font-bold">Delete products from your profile</h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      This section gives you a direct delete option for your products.
                    </p>
                  </div>
                  <Link
                    to="/dashboard/seller"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Open Seller Dashboard
                  </Link>
                </div>

                {sellerProducts.length ? (
                  <div className="mt-6 space-y-3">
                    {sellerProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image_url || "https://placehold.co/120x120?text=Product"}
                            alt={product.name}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Rs. {product.price} | Stock {product.stock}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteSellerProduct(product.id)}
                          disabled={deletingId === product.id}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === product.id ? "Deleting..." : "Delete Product"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-950/35">
                    <ShieldCheck className="mx-auto h-8 w-8 text-teal-600 dark:text-teal-300" />
                    <p className="mt-3 font-semibold">No products found for this seller profile.</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Add products in the seller dashboard, and they will also appear here with a delete option.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
