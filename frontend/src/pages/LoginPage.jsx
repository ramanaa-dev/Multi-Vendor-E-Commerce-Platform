import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const result = await login(form.email, form.password);
      if (result.success) {
        toast.success("Login successful");

        const role = result.data.user.role;
        if (role === "customer") navigate("/dashboard/customer");
        else if (role === "seller") navigate("/dashboard/seller");
        else if (role === "admin") navigate("/dashboard/admin");
        else navigate(redirectTo);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md section-fade">
      <div className="glass-card rounded-3xl p-7 shadow-soft">
        <h1 className="brand-font text-3xl font-bold">Welcome Back</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Login to your account to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-sky-700 dark:text-sky-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
