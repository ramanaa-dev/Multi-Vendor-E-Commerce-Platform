import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import DashboardSidebar from "../components/DashboardSidebar";
import Loader from "../components/Loader";
import OrderStatusBadge from "../components/OrderStatusBadge";
import StatCard from "../components/StatCard";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const monthlyData = useMemo(
    () =>
      (stats?.monthly_revenue || []).map((item) => ({
        month: item.month,
        revenue: item.revenue
      })),
    [stats]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        adminAPI.dashboard(),
        adminAPI.users({ page: 1, per_page: 50 }),
        adminAPI.products({ page: 1, per_page: 50 }),
        adminAPI.orders({ page: 1, per_page: 50 }),
        adminAPI.categories()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data.items);
      if (productsRes.success) setProducts(productsRes.data.items);
      if (ordersRes.success) setOrders(ordersRes.data.items);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch {
      toast.error("Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveSeller = async (sellerId) => {
    try {
      const result = await adminAPI.approveSeller(sellerId);
      if (result.success) {
        toast.success("Seller approved");
        loadData();
      }
    } catch {
      toast.error("Could not approve seller");
    }
  };

  const toggleBlock = async (user) => {
    if (user.role === "admin") {
      toast.error("Cannot change admin status");
      return;
    }

    const nextStatus = user.status === "blocked" ? "active" : "blocked";
    try {
      const result = await adminAPI.updateUserStatus(user.id, { status: nextStatus });
      if (result.success) {
        toast.success(`User ${nextStatus === "blocked" ? "blocked" : "activated"}`);
        loadData();
      }
    } catch {
      toast.error("Could not update user status");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const result = await adminAPI.deleteProduct(id);
      if (result.success) {
        toast.success("Product deleted");
        loadData();
      }
    } catch {
      toast.error("Could not delete product");
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const result = await adminAPI.addCategory({ name: newCategory.trim() });
      if (result.success) {
        toast.success("Category added");
        setNewCategory("");
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add category");
    }
  };

  const removeCategory = async (id) => {
    try {
      const result = await adminAPI.deleteCategory(id);
      if (result.success) {
        toast.success("Category deleted");
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete category");
    }
  };

  const exportReport = async (type) => {
    try {
      const blob = await adminAPI.exportReport(type);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type}_report.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded`);
    } catch {
      toast.error("Could not export report");
    }
  };

  if (loading) return <Loader text="Loading admin dashboard..." />;

  return (
    <div className="grid gap-5 section-fade lg:grid-cols-[250px,1fr]">
      <DashboardSidebar
        title="Admin"
        active={tab}
        onSelect={setTab}
        items={[
          { key: "overview", label: "Overview" },
          { key: "users", label: "Users" },
          { key: "products", label: "Products" },
          { key: "categories", label: "Categories" },
          { key: "orders", label: "Orders" }
        ]}
      />

      <div className="space-y-5">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Users" value={stats?.total_users || 0} />
              <StatCard title="Sellers" value={stats?.total_sellers || 0} hint={`${stats?.pending_sellers || 0} pending`} />
              <StatCard title="Orders" value={stats?.total_orders || 0} />
              <StatCard title="Revenue" value={`Rs. ${stats?.total_revenue || 0}`} />
            </div>

            <div className="glass-card rounded-2xl p-5 shadow-soft">
              <h2 className="brand-font text-xl font-bold">Revenue Trend</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 shadow-soft">
              <h3 className="brand-font text-lg font-bold">Export Reports</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportReport("users")}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                >
                  Export Users
                </button>
                <button
                  type="button"
                  onClick={() => exportReport("products")}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                >
                  Export Products
                </button>
                <button
                  type="button"
                  onClick={() => exportReport("orders")}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                >
                  Export Orders
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="glass-card rounded-2xl p-5 shadow-soft">
            <h2 className="brand-font text-xl font-bold">Manage Users</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Seller Details</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="py-2 font-semibold">{user.name}</td>
                      <td className="py-2">{user.email}</td>
                      <td className="py-2 uppercase">{user.role}</td>
                      <td className="py-2">
                        {user.role === "seller" ? (
                          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {user.seller_profile?.company_name || "No company name"}
                            </p>
                            <p>{user.seller_profile?.company_phone || "No phone number"}</p>
                            <p>{user.seller_profile?.company_address || "No address"}</p>
                            {user.seller_profile?.company_website && (
                              <a
                                href={user.seller_profile.company_website}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-sky-700 dark:text-sky-300"
                              >
                                {user.seller_profile.company_website}
                              </a>
                            )}
                            <p>{user.seller_profile?.business_description || "No business description"}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Not a seller application</span>
                        )}
                      </td>
                      <td className="py-2 uppercase">{user.status}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          {user.role === "seller" && user.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => approveSeller(user.id)}
                              className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                            >
                              Approve
                            </button>
                          )}
                          {user.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => toggleBlock(user)}
                              className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                            >
                              {user.status === "blocked" ? "Unblock" : "Block"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="glass-card rounded-2xl p-5 shadow-soft">
            <h2 className="brand-font text-xl font-bold">Manage Products</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Seller</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="py-2 font-semibold">{product.name}</td>
                      <td className="py-2">{product?.seller?.name || "-"}</td>
                      <td className="py-2">{product?.category?.name || "-"}</td>
                      <td className="py-2">Rs. {product.price}</td>
                      <td className="py-2">{product.stock}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div className="space-y-4">
            <form onSubmit={addCategory} className="glass-card rounded-2xl p-5 shadow-soft">
              <h2 className="brand-font text-xl font-bold">Category Management</h2>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="New category name"
                  className="flex-1 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Add Category
                </button>
              </div>
            </form>

            <div className="glass-card rounded-2xl p-5 shadow-soft">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <span className="font-semibold">{category.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="glass-card rounded-2xl p-5 shadow-soft">
            <h2 className="brand-font text-xl font-bold">Platform Orders</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-900">
                      <td className="py-2 font-semibold">#{order.id}</td>
                      <td className="py-2">{order.customer_name}</td>
                      <td className="py-2">Rs. {order.total_amount}</td>
                      <td className="py-2">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
