import Button from "./Button";
import Icon from "./Icon";
import { Link } from "react-router-dom";
import { PLACEHOLDER_IMAGE } from "../config/env";
import { safeImageUrl } from "../utils/security";

export default function ProductCard({ product, onAdd, onToggleWishlist, wished = false }) {
  const badge = product.badge || (product.stock < 5 ? "Sale" : "New");
  const name = product.name || "Unavailable product";
  const image = safeImageUrl(product.image, PLACEHOLDER_IMAGE);

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="absolute left-2 top-2 z-10 max-w-[calc(100%-3.5rem)] truncate rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
        {badge}
      </div>

      <button
        onClick={() => onToggleWishlist?.(product)}
        className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:text-blue-600 dark:bg-slate-900 dark:text-slate-300 sm:right-3 sm:top-3"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        <span className={wished ? "text-blue-600 dark:text-sky-400" : ""}>
          {wished ? "♥" : "♡"}
        </span>
      </button>

      <Link to={`/products/${product._id}`} className="aspect-[4/5] w-full overflow-hidden bg-slate-50 dark:bg-slate-900" aria-label={`View ${name}`}>
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-sky-300">
          {name}
        </Link>

        <div className="mt-2 flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
          <span className="text-blue-600 dark:text-sky-400">★★★★★</span>
          <span>{Number(product.ratings || 0).toFixed(1)}</span>
          <span className="truncate">({product.numReviews || 0})</span>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words text-base font-semibold text-blue-600 dark:text-sky-400 sm:text-lg">
            ₹{product.price}
          </p>
          <Button onClick={() => onAdd?.(product)} className="w-full gap-1 px-3 py-2 sm:w-auto">
            <Icon name="cart" className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}
