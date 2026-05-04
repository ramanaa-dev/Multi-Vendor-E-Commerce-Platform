import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductCard from "../components/ProductCard";
import SkeletonGrid from "../components/SkeletonGrid";
import { useAuth } from "../context/AuthContext";
import { cartAPI, customerAPI, productsAPI } from "../services/api";

const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    min_price: "",
    max_price: "",
    sort_by: "created_at",
    order: "desc",
    page: 1,
    per_page: 12
  });

  const query = useMemo(() => {
    const payload = { ...filters };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });
    return payload;
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const result = await productsAPI.categories();
      if (result.success) setCategories(result.data);
    } catch {
      toast.error("Unable to load categories");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.list(query);
      if (result.success) {
        setProducts(result.data.items);
        setPagination(result.data.pagination);
      }
    } catch {
      toast.error("Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [query]);

  const addToCart = async (product) => {
    if (!user || user.role !== "customer") {
      toast.error("Login as customer to add items to cart");
      return;
    }
    try {
      const result = await cartAPI.add({ product_id: product.id, quantity: 1 });
      if (result.success) toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add product");
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
      toast.error(error.response?.data?.message || "Unable to add wishlist item");
    }
  };

  return (
    <div className="space-y-5 section-fade">
      <div className="glass-card rounded-2xl p-4 shadow-soft">
        <h1 className="brand-font mb-4 text-2xl font-bold">Explore Products</h1>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
            placeholder="Search products"
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
          />
          <select
            value={filters.category_id}
            onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value, page: 1 }))}
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={filters.min_price}
            onChange={(event) => setFilters((prev) => ({ ...prev, min_price: event.target.value, page: 1 }))}
            placeholder="Min price"
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
          />
          <input
            type="number"
            value={filters.max_price}
            onChange={(event) => setFilters((prev) => ({ ...prev, max_price: event.target.value, page: 1 }))}
            placeholder="Max price"
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
          />
          <select
            value={`${filters.sort_by}:${filters.order}`}
            onChange={(event) => {
              const [sort_by, order] = event.target.value.split(":");
              setFilters((prev) => ({ ...prev, sort_by, order, page: 1 }));
            }}
            className="rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring dark:border-slate-700 dark:bg-slate-900/80"
          >
            <option value="created_at:desc">Newest</option>
            <option value="price:asc">Price low-high</option>
            <option value="price:desc">Price high-low</option>
            <option value="name:asc">Name A-Z</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setFilters({ search: "", category_id: "", min_price: "", max_price: "", sort_by: "created_at", order: "desc", page: 1, per_page: 12 })
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={8} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onAddToWishlist={addWishlist}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">No products found.</div>
          )}
        </>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={!pagination.has_prev}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
          >
            Prev
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={!pagination.has_next}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
