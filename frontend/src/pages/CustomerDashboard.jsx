import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Wallet } from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import Loader from "../components/Loader";
import OrderStatusBadge from "../components/OrderStatusBadge";
import ProductCard from "../components/ProductCard";
import StatCard from "../components/StatCard";
import { customerAPI, ordersAPI } from "../services/api";

const CustomerDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const sidebarItems = useMemo(
    () => [
      { key: "overview", label: "Overview", hint: "Spending and recent activity" },
      { key: "orders", label: "Order History", hint: "Track payment and delivery details", count: orders.length },
      { key: "wishlist", label: "Wishlist", hint: "Saved products for later", count: wishlist.length }
    ],
    [orders.length, wishlist.length]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, ordersRes, wishlistRes] = await Promise.all([
        customerAPI.dashboard(),
        ordersAPI.history({ page: 1, per_page: 20 }),
        customerAPI.wishlist()
      ]);

      if (dashboardRes.success) setOverview(dashboardRes.data);
      if (ordersRes.success) setOrders(ordersRes.data.items);
      if (wishlistRes.success) setWishlist(wishlistRes.data);
    } catch {
      toast.error("Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const removeWishlist = async (productId) => {
    try {
      const result = await customerAPI.removeWishlist(productId);
      if (result.success) {
        toast.success("Removed from wishlist");
        setWishlist((prev) => prev.filter((item) => item.product_id !== productId));
      }
    } catch {
      toast.error("Could not remove wishlist item");
    }
  };

  if (loading) return <Loader text="Loading customer dashboard..." />;

  return (
    <div className="grid gap-6 section-fade lg:grid-cols-[280px,1fr]">
      <DashboardSidebar title="Customer Hub" active={tab} onSelect={setTab} items={sidebarItems} />

      <div className="space-y-6">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Total Orders" value={overview?.orders_count || 0} hint="Completed and active orders" />
              <StatCard title="Total Spent" value={`Rs. ${overview?.total_spent || 0}`} hint="All-time checkout total" />
              <StatCard title="Wishlist Items" value={overview?.wishlist_count || 0} hint="Products saved for later" />
            </div>

            <div className="glass-card rounded-[30px] p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Recent Orders</p>
              <h2 className="brand-font mt-2 text-2xl font-bold">Latest activity on your account</h2>
              <div className="mt-5 space-y-4">
                {overview?.recent_orders?.length ? (
                  overview.recent_orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">Order #{order.id}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Rs. {order.total_amount} | {order.payment_method_label || "Payment selected"}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent orders.</p>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "orders" && (
          <section className="space-y-5">
            <div className="glass-card rounded-[30px] p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Order History</p>
              <h2 className="brand-font mt-2 text-2xl font-bold">Payment methods, addresses, and delivery status</h2>
            </div>

            {orders.length ? (
              orders.map((order) => (
                <article key={order.id} className="glass-card rounded-[30px] p-6 shadow-soft">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="brand-font text-2xl font-bold">Order #{order.id}</h3>
                        <OrderStatusBadge status={order.status} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {order.payment_method_label || order.payment_method || "Payment pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleString()} | Total Rs. {order.total_amount}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200/80 bg-white/70 px-5 py-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reference</p>
                      <p className="mt-1 font-semibold">{order.payment_reference || "Generated at checkout"}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
                    <div className="space-y-3">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-950/35"
                        >
                          <img
                            src={item.product_image || "https://placehold.co/140x140?text=Item"}
                            alt={item.product_name || "Order item"}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{item.product_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Quantity {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold">Rs. {Number(item.price) * Number(item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Shipping Address</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {order.shipping_address || "No address saved"}
                            </p>
                            {order.contact_phone && (
                              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Phone: {order.contact_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
                            <Wallet className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Payment Method</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {order.payment_method_label || order.payment_method || "Not available"}
                            </p>
                            {order.payment_qr_payload && (
                              <p className="mt-2 break-all text-xs leading-5 text-slate-400 dark:text-slate-500">
                                QR payload: {order.payment_qr_payload}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="glass-card rounded-[30px] p-10 text-center shadow-soft">
                <p className="text-lg font-semibold">No orders yet.</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Place an order and your address, payment method, and status updates will appear here.
                </p>
              </div>
            )}
          </section>
        )}

        {tab === "wishlist" && (
          <div className="space-y-4">
            <div className="glass-card rounded-[30px] p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Wishlist</p>
                  <h2 className="brand-font mt-2 text-2xl font-bold">Saved products</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-200">
                  {wishlist.length} items
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {wishlist.map((item) => (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => removeWishlist(item.product_id)}
                    className="absolute right-4 top-4 z-10 rounded-full bg-rose-600/90 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Remove
                  </button>
                  <ProductCard product={item.product} showActions={false} />
                </div>
              ))}
            </div>

            {wishlist.length === 0 && (
              <div className="glass-card rounded-[30px] p-10 text-center text-slate-500 shadow-soft dark:text-slate-400">
                Wishlist is empty.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
