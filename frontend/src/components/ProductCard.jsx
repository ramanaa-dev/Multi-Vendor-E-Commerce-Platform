import { ArrowUpRight, Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, onAddToCart, onAddToWishlist, showActions = true }) => {
  return (
    <article className="group glass-card section-fade overflow-hidden rounded-[32px] transition duration-300 hover:-translate-y-1.5">
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden">
        <img
          src={product.image_url || "https://placehold.co/900x700?text=Product"}
          alt={product.name}
          className="h-60 w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-stone-800 backdrop-blur dark:bg-stone-950/80 dark:text-stone-100">
            {product?.category?.name || "General"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-50 backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-current" />
            {product.rating || 0}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {product?.seller?.name && <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{product.seller.name}</p>}
            <h3 className="brand-font mt-1 truncate text-2xl font-semibold text-white">{product.name}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
              product.stock > 0 ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100"
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <p className="line-clamp-3 text-sm leading-7 text-[color:var(--text-soft)]">{product.description}</p>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">Market Price</p>
            <p className="mt-1 text-2xl font-bold text-[color:var(--text-main)]">Rs. {product.price}</p>
          </div>
          <div className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-soft)]">
            {product.reviews_count || 0} reviews
          </div>
        </div>

        {showActions && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onAddToCart?.(product)}
              disabled={product.stock < 1}
              className="button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => onAddToWishlist?.(product)}
              className="button-secondary px-4"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        )}

        {!showActions && (
          <div className="flex items-center justify-between rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-bg-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--text-main)]">
            <span>Open product details</span>
            <ArrowUpRight className="h-4 w-4 text-[color:var(--brand)]" />
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
