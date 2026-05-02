import { memo, useMemo, useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import { Link } from "react-router-dom";
import { PLACEHOLDER_IMAGE } from "../config/env";
import { safeImageUrl } from "../utils/security";

function ProductCard({ product, onAdd, onToggleWishlist, wished = false }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const badge = product.badge || (product.stock < 5 ? "Sale" : "New");
  const name = product.name || "Unavailable product";
  const image = useMemo(() => safeImageUrl(product.image, PLACEHOLDER_IMAGE), [product.image]);
  const price = Number(product.price || 0);

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[var(--shadow-card-hover)] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-800">
      <div className="absolute left-2 top-2 z-10 max-w-[calc(100%-3.5rem)] truncate rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
        {badge}
      </div>

      <button
        type="button"
        onClick={() => onToggleWishlist?.(product)}
        className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:scale-105 hover:text-blue-600 dark:bg-slate-900 dark:text-slate-300 sm:right-3 sm:top-3"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Icon name="heart" className={`h-4 w-4 ${wished ? "fill-current text-blue-600 dark:text-sky-400" : ""}`} />
      </button>

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Link to={`/products/${product._id}`} className="block h-full w-full" aria-label={`View ${name}`}>
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          className="absolute bottom-3 left-3 right-3 hidden min-h-[38px] items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white/95 px-3 text-xs font-semibold text-slate-800 opacity-0 shadow-sm transition duration-200 hover:bg-white group-hover:opacity-100 dark:bg-slate-950/95 dark:text-slate-100 sm:inline-flex"
        >
          <Icon name="eye" className="h-4 w-4" />
          Quick view
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-slate-900 transition hover:text-blue-600 dark:text-slate-100 dark:hover:text-sky-300" title={name}>
          {name}
        </Link>

        <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
          <span className="text-blue-600 dark:text-sky-400">★★★★★</span>
          <span>{Number(product.ratings || 0).toFixed(1)}</span>
          <span className="truncate">({product.numReviews || 0})</span>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words text-base font-semibold text-blue-600 dark:text-sky-400 sm:text-lg">
            ₹{price}
          </p>
          <Button onClick={() => onAdd?.(product)} className="w-full gap-1 px-3 py-2 sm:w-auto">
            <Icon name="cart" className="h-4 w-4" />
            Quick add
          </Button>
        </div>
      </div>

      {quickViewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={`${name} quick view`}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-4 p-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <img src={image} alt={name} className="aspect-square w-full rounded-xl bg-slate-50 object-cover dark:bg-slate-800" />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-lg font-bold text-slate-950 dark:text-slate-50">{name}</h3>
                  <button type="button" onClick={() => setQuickViewOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Close quick view">
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-lg font-bold text-blue-600 dark:text-sky-400">₹{price}</p>
                <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                  {product.description || "Product details are available on the product page."}
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => onAdd?.(product)} className="gap-2">
                    <Icon name="cart" className="h-4 w-4" />
                    Quick add
                  </Button>
                  <Link to={`/products/${product._id}`} className="inline-flex min-h-[var(--control-height)] items-center justify-center rounded-[var(--radius-control)] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default memo(ProductCard);
