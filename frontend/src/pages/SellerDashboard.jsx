import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Boxes,
  ImagePlus,
  MapPinHouse,
  PackagePlus,
  Pencil,
  PhoneCall,
  QrCode,
  Sparkles,
  Trash2,
  WalletCards
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import Loader from "../components/Loader";
import OrderStatusBadge from "../components/OrderStatusBadge";
import StatCard from "../components/StatCard";
import { productsAPI, sellerAPI } from "../services/api";

const initialProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  image_url: "",
  image_file: null
};

const statusOptions = ["placed", "processing", "shipped", "delivered", "cancelled"];

const SellerDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingId, setEditingId] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [localPreview, setLocalPreview] = useState("");

  const monthlyData = useMemo(
    () =>
      (stats?.monthly_revenue || []).map((item) => ({
        month: item.month,
        revenue: item.revenue
      })),
    [stats]
  );

  const activeSidebarItems = useMemo(
    () => [
      { key: "overview", label: "Overview", hint: "Revenue, orders, and growth" },
      { key: "products", label: "Products", hint: "Create, edit, and remove listings", count: products.length },
      { key: "orders", label: "Orders", hint: "Track delivery and payment info", count: orders.length }
    ],
    [orders.length, products.length]
  );

  useEffect(() => {
    if (!productForm.image_file) {
      setLocalPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(productForm.image_file);
    setLocalPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [productForm.image_file]);

  const previewImage = localPreview || productForm.image_url || "https://placehold.co/900x700?text=Product+Preview";

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        sellerAPI.dashboard(),
        sellerAPI.products({ page: 1, per_page: 50 }),
        sellerAPI.orders(),
        productsAPI.categories()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (productsRes.success) setProducts(productsRes.data.items);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch {
      toast.error("Unable to load seller dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setProductForm(initialProductForm);
    setEditingId(null);
  };

  const updateProductField = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    if (!productForm.category_id) {
      toast.error("Select category");
      return;
    }

    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("description", productForm.description);
    formData.append("price", productForm.price);
    formData.append("stock", productForm.stock);
    formData.append("category_id", productForm.category_id);
    if (productForm.image_url) formData.append("image_url", productForm.image_url);
    if (productForm.image_file) formData.append("image", productForm.image_file);

    try {
      setSavingProduct(true);
      const result = editingId
        ? await sellerAPI.updateProduct(editingId, formData)
        : await sellerAPI.addProduct(formData);

      if (result.success) {
        toast.success(editingId ? "Product updated" : "Product created");
        resetForm();
        await loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save product");
    } finally {
      setSavingProduct(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      image_url: product.image_url || "",
      image_file: null
    });
    setTab("products");
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Remove this product listing?")) return;

    try {
      const result = await sellerAPI.deleteProduct(id);
      if (result.success) {
        toast.success("Product removed from storefront");
        if (editingId === id) {
          resetForm();
        }
        await loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete product");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const result = await sellerAPI.updateOrderStatus(orderId, { status });
      if (result.success) {
        toast.success("Order status updated");
        await loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update status");
    }
  };

  if (loading) return <Loader text="Loading seller dashboard..." />;

  return (
    <div className="grid gap-6 section-fade lg:grid-cols-[280px,1fr]">
      <DashboardSidebar title="Seller Studio" active={tab} onSelect={setTab} items={activeSidebarItems} />

      <div className="space-y-6">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Products" value={stats?.products_count || 0} hint="Active storefront listings" />
              <StatCard title="Orders" value={stats?.orders_count || 0} hint="Orders touching your catalog" />
              <StatCard title="Units Sold" value={stats?.units_sold || 0} hint="Confirmed item movement" />
              <StatCard title="Revenue" value={`Rs. ${stats?.revenue || 0}`} hint="Total earned so far" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
              <section className="glass-card rounded-[30px] p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Sales Curve</p>
                    <h2 className="brand-font mt-2 text-2xl font-bold">Monthly revenue trend</h2>
                  </div>
                  <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                    Updated from live seller orders
                  </div>
                </div>
                <div className="mt-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#94a3b833" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="glass-card rounded-[30px] p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-700 dark:text-fuchsia-300">Seller Pulse</p>
                <h2 className="brand-font mt-2 text-2xl font-bold">What to do next</h2>

                <div className="mt-5 space-y-4">
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                        <PackagePlus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Refresh your storefront</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload clear product photos or paste image URLs for each listing.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Monitor stock closely</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Items set to zero stock stay visible but stop converting well.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Move orders forward</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Processing and shipped statuses help customers trust the seller journey.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
        {tab === "products" && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <form onSubmit={submitProduct} className="glass-card rounded-[30px] p-6 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Listing Builder</p>
                    <h2 className="brand-font mt-2 text-2xl font-bold">{editingId ? "Edit product" : "Add a new product"}</h2>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold">Product Name</label>
                    <input
                      required
                      placeholder="Enter product name"
                      value={productForm.name}
                      onChange={(event) => updateProductField("name", event.target.value)}
                      className="soft-input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Category</label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(event) => updateProductField("category_id", event.target.value)}
                      className="soft-select"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Price</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={productForm.price}
                      onChange={(event) => updateProductField("price", event.target.value)}
                      className="soft-input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Stock</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={productForm.stock}
                      onChange={(event) => updateProductField("stock", event.target.value)}
                      className="soft-input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Image URL</label>
                    <input
                      placeholder="https://example.com/image.jpg"
                      value={productForm.image_url}
                      onChange={(event) => updateProductField("image_url", event.target.value)}
                      className="soft-input"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold">Product Image Upload</label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-4 py-4 transition hover:border-sky-400 hover:bg-sky-50/60 dark:border-slate-700 dark:bg-slate-950/35 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10">
                      <span className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{productForm.image_file?.name || "Choose product image"}</span>
                        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                          Upload from your device or keep using the image URL. Uploaded files take priority.
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => updateProductField("image_file", event.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold">Description</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe the product, materials, features, and benefits"
                      value={productForm.description}
                      onChange={(event) => updateProductField("description", event.target.value)}
                      className="soft-textarea"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="mt-6 rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProduct ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
              </form>

              <section className="glass-card rounded-[30px] p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-700 dark:text-fuchsia-300">Live Preview</p>
                <h3 className="brand-font mt-2 text-2xl font-bold">See your product card before publishing</h3>

                <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-950/35">
                  <img src={previewImage} alt="Product preview" className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {categories.find((category) => String(category.id) === String(productForm.category_id))?.name || "Category"}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {productForm.stock || 0} in stock
                      </span>
                    </div>
                    <h4 className="mt-3 text-xl font-bold">{productForm.name || "Product name will appear here"}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {productForm.description || "Write a strong product description so customers understand the value quickly."}
                    </p>
                    <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      Rs. {productForm.price || "0.00"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                    <p className="font-semibold">Image source options</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      You can upload an image file or paste an image URL. Both are supported on every product listing.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-950/35">
                    <p className="font-semibold">Delete behavior</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Removing a product hides it from the storefront while keeping past order history intact.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="glass-card rounded-[30px] p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Storefront Inventory</p>
                  <h3 className="brand-font mt-2 text-2xl font-bold">Your active products</h3>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-200">
                  {products.length} live listings
                </div>
              </div>

              {products.length ? (
                <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70 shadow-soft transition duration-300 hover:-translate-y-1 dark:border-slate-700/70 dark:bg-slate-950/35"
                    >
                      <div className="relative">
                        <img
                          src={product.image_url || "https://placehold.co/900x700?text=Product"}
                          alt={product.name}
                          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                              {product?.category?.name || "General"}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.stock > 0
                                  ? "bg-emerald-400/20 text-emerald-100"
                                  : "bg-rose-400/20 text-rose-100"
                              }`}
                            >
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold">{product.name}</h4>
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{product.description}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            #{product.id}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Rs. {product.price}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Added {new Date(product.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mt-5 flex gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-sky-300 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-200 dark:hover:bg-sky-500/10"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-950/35">
                  <p className="text-lg font-semibold">No products yet.</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Add your first product with an image URL or file upload to start selling.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "orders" && (
          <section className="space-y-5">
            <div className="glass-card rounded-[30px] p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Seller Orders</p>
              <h2 className="brand-font mt-2 text-2xl font-bold">Order handling and delivery information</h2>
            </div>

            {orders.length ? (
              orders.map((order) => (
                <article key={order.order_id} className="glass-card rounded-[30px] p-6 shadow-soft">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="brand-font text-2xl font-bold">Order #{order.order_id}</h3>
                        <OrderStatusBadge status={order.status} />
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {order.payment_method_label || order.payment_method || "Payment pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Customer: {order.customer_name || "Unknown"} | Total for you: Rs. {order.seller_total}
                      </p>
                    </div>

                    <div className="w-full xl:max-w-xs">
                      <label className="mb-2 block text-sm font-semibold">Update Status</label>
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order.order_id, event.target.value)}
                        className="soft-select"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
                    <div className="space-y-3">
                      {order.items.map((item) => (
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
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                            <MapPinHouse className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Shipping Address</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {order.shipping_address || "No address on file"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700/70 dark:bg-slate-950/35">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              <PhoneCall className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold">Phone</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.contact_phone || "Not provided"}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200">
                              {order.payment_method === "qr_payment" ? <QrCode className="h-5 w-5" /> : <WalletCards className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-semibold">Payment</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {order.payment_method_label || order.payment_method || "Not available"}
                              </p>
                              {order.payment_reference && (
                                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                  Ref: {order.payment_reference}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="glass-card rounded-[30px] p-10 text-center shadow-soft">
                <p className="text-lg font-semibold">No orders assigned yet.</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Once customers place orders for your products, they will appear here with address and payment details.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
