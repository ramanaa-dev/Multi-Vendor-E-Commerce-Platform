import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { cartAPI, customerAPI, productsAPI } from "../services/api";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  const loadProduct = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.details(id);
      if (result.success) {
        setProduct(result.data);
      }
    } catch {
      toast.error("Unable to load product details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  const addToCart = async () => {
    if (!user || user.role !== "customer") {
      toast.error("Login as customer to add cart items");
      return;
    }
    try {
      const result = await cartAPI.add({ product_id: product.id, quantity: Number(quantity) });
      if (result.success) toast.success("Product added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add to cart");
    }
  };

  const addWishlist = async () => {
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

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user || user.role !== "customer") {
      toast.error("Login as customer to add a review");
      return;
    }

    try {
      const result = await customerAPI.addReview({
        product_id: product.id,
        rating: Number(review.rating),
        comment: review.comment
      });
      if (result.success) {
        toast.success(result.message);
        setReview({ rating: 5, comment: "" });
        await loadProduct();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit review");
    }
  };

  if (loading) return <Loader text="Loading product details..." />;
  if (!product) return <div className="glass-card rounded-2xl p-8 text-center">Product not found.</div>;

  return (
    <div className="space-y-6 section-fade">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card overflow-hidden rounded-3xl shadow-soft">
          <img
            src={product.image_url || "https://placehold.co/900x600?text=Product"}
            alt={product.name}
            className="h-full min-h-[320px] w-full object-cover"
          />
        </div>

        <div className="glass-card rounded-3xl p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {product?.category?.name || "General"}
          </p>
          <h1 className="brand-font mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{product.description}</p>
          <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100">Rs. {product.price}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              ⭐ {product.rating}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {product.reviews_count} reviews
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {product.stock} available
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-24 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
            />
            <button
              type="button"
              onClick={addToCart}
              className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={addWishlist}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-5 shadow-soft">
          <h2 className="brand-font text-xl font-bold">Customer Reviews</h2>
          <div className="mt-4 space-y-3">
            {product.reviews?.length ? (
              product.reviews.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.user_name}</p>
                    <span className="text-amber-600 dark:text-amber-300">⭐ {item.rating}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p>
            )}
          </div>
        </div>

        <form onSubmit={submitReview} className="glass-card rounded-2xl p-5 shadow-soft">
          <h2 className="brand-font text-xl font-bold">Add Your Review</h2>
          <div className="mt-4 space-y-3">
            <select
              value={review.rating}
              onChange={(event) => setReview((prev) => ({ ...prev, rating: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} Star
                </option>
              ))}
            </select>
            <textarea
              rows={4}
              value={review.comment}
              onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Write your product experience"
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
            />
            <button
              type="submit"
              className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
