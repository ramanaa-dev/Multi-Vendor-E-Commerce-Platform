import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import { cartAPI } from "../services/api";

const CartPage = () => {
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      setLoading(true);
      const result = await cartAPI.get();
      if (result.success) {
        setCart(result.data);
      }
    } catch {
      toast.error("Unable to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const result = await cartAPI.updateItem(itemId, { quantity });
      if (result.success) {
        toast.success("Quantity updated");
        loadCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update quantity");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const result = await cartAPI.deleteItem(itemId);
      if (result.success) {
        toast.success("Item removed");
        loadCart();
      }
    } catch {
      toast.error("Could not remove item");
    }
  };

  if (loading) return <Loader text="Loading cart..." />;

  return (
    <div className="space-y-5 section-fade">
      <h1 className="brand-font text-3xl font-bold">Your Cart</h1>

      {cart.items.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.items.map((item) => (
              <div key={item.id} className="glass-card flex flex-col gap-3 rounded-2xl p-4 shadow-soft sm:flex-row">
                <img
                  src={item.product.image_url || "https://placehold.co/400x300?text=Product"}
                  alt={item.product.name}
                  className="h-24 w-full rounded-xl object-cover sm:w-32"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.product.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rs. {item.product.price}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="rounded-lg border border-slate-300 px-3 py-1 dark:border-slate-700"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="ml-auto rounded-lg border border-rose-300 px-3 py-1 text-sm font-semibold text-rose-600 dark:border-rose-800 dark:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card h-fit rounded-2xl p-5 shadow-soft">
            <h3 className="brand-font text-xl font-bold">Order Summary</h3>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>Rs. {cart.total_amount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>Shipping</span>
              <span>Rs. 0</span>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>Rs. {cart.total_amount}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
