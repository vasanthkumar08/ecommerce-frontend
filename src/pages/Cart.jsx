import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Icon from "../components/Icon";
import { CartSkeleton } from "../components/Skeleton";
import { setCart } from "../features/cart/cartSlice";
import api from "../services/api";
import { normalizeCart } from "../utils/normalize";
import { getJson, setJson } from "../utils/storage";

const itemKey = (item) => item.product?._id || item._id || item.id || item.name;
const CART_CACHE_KEY = "cart:cache";
const CART_PENDING_KEY = "cart:pending";
const SYNC_DELAY = 500;

const isBrowserOnline = () => typeof navigator === "undefined" ? true : navigator.onLine;
const normalizeCachedItems = (items) => normalizeCart({ items: Array.isArray(items) ? items : [] });
const mergeCartItems = (serverItems = [], localItems = []) => {
  const merged = new Map();

  serverItems.forEach((item) => {
    if (item.product?._id) merged.set(item.product._id, item);
  });

  localItems.forEach((item) => {
    if (!item.product?._id) return;
    const existing = merged.get(item.product._id);
    merged.set(item.product._id, {
      ...existing,
      ...item,
      quantity: Math.max(Number(existing?.quantity || 0), Number(item.quantity || 1)),
    });
  });

  return Array.from(merged.values());
};
const getPendingOps = () => getJson(CART_PENDING_KEY, { upserts: {}, removals: [] });
const savePendingOps = (ops) => setJson(CART_PENDING_KEY, {
  upserts: ops.upserts || {},
  removals: Array.from(new Set(ops.removals || [])),
});

const CartItem = memo(function CartItem({ item, busyAction, onIncrease, onDecrease, onRemove }) {
  const key = itemKey(item);
  const isIncreasing = busyAction === `${key}:increase`;
  const isDecreasing = busyAction === `${key}:decrease`;
  const isRemoving = busyAction === `${key}:remove`;
  const isBusy = Boolean(busyAction?.startsWith(`${key}:`));

  return (
    <article className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 sm:p-4 md:grid-cols-[112px_minmax(0,1fr)_auto]">
      <img src={item.product?.image || item.image} alt={item.product?.name || item.name} className="aspect-[4/3] w-full rounded-xl bg-slate-50 object-cover dark:bg-slate-900 md:h-28 md:w-28" />
      <div className="min-w-0">
        <h2 className="break-words font-semibold text-slate-950 dark:text-slate-50">{item.product?.name || item.name}</h2>
        <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-sky-400">₹{item.product?.price}</p>
        <button
          type="button"
          onClick={(event) => onRemove(event, item)}
          disabled={isBusy}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300"
        >
          {isRemoving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />}
          Remove
        </button>
      </div>
      <div className="flex h-max w-full max-w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 sm:w-max sm:justify-start">
        <button
          type="button"
          onClick={(event) => onDecrease(event, item)}
          disabled={isBusy}
          className="grid h-11 w-11 place-items-center disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          {isDecreasing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" /> : <Icon name="minus" className="h-4 w-4" />}
        </button>
        <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
        <button
          type="button"
          onClick={(event) => onIncrease(event, item)}
          disabled={isBusy}
          className="grid h-11 w-11 place-items-center disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Increase quantity"
        >
          {isIncreasing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" /> : <Icon name="plus" className="h-4 w-4" />}
        </button>
      </div>
    </article>
  );
});

export default function Cart() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [isOnline, setIsOnline] = useState(isBrowserOnline);
  const debounceTimers = useRef({});
  const latestItemsRef = useRef([]);

  const syncItems = useCallback((nextItems) => {
    latestItemsRef.current = nextItems;
    setItems(nextItems);
    dispatch(setCart(nextItems));
    setJson(CART_CACHE_KEY, nextItems);
  }, [dispatch]);

  const subtotal = useMemo(
    () => items.reduce(
      (sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 1),
      0
    ),
    [items]
  );

  const loadCart = useCallback(async () => {
    const cachedItems = normalizeCachedItems(getJson(CART_CACHE_KEY, []));
    if (cachedItems.length) {
      syncItems(cachedItems);
      setLoading(false);
    }

    if (!isBrowserOnline()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/cart");
      const serverItems = normalizeCart(res.data);
      const pending = getPendingOps();
      const removedIds = new Set(pending.removals || []);
      const localItems = latestItemsRef.current.filter((item) => !removedIds.has(item.product?._id));
      syncItems(mergeCartItems(serverItems, localItems));
    } catch {
      if (!cachedItems.length) syncItems([]);
    } finally {
      setLoading(false);
    }
  }, [syncItems]);

  useEffect(() => {
    Promise.resolve().then(loadCart);
  }, [loadCart]);

  const syncPendingCart = useCallback(async () => {
    if (!isBrowserOnline()) return;

    const pending = getPendingOps();
    const removals = Array.from(new Set(pending.removals || []));
    const upserts = Object.values(pending.upserts || {});

    if (!removals.length && !upserts.length) return;

    try {
      await Promise.all(removals.map((productId) => api.delete(`/cart/remove/${productId}`)));
      await Promise.all(upserts.map((item) => api.put("/cart/update", {
        product: item.productId,
        quantity: item.quantity,
      })));
      savePendingOps({ upserts: {}, removals: [] });
    } catch {
      toast.info("Cart changes saved locally. We will sync again when online.");
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingCart();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingCart]);

  useEffect(() => {
    if (isOnline) syncPendingCart();
  }, [isOnline, syncPendingCart]);

  useEffect(() => () => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
  }, []);

  const queueQuantitySync = useCallback((productId, quantity, previousItems, itemQuantity) => {
    const pending = getPendingOps();
    savePendingOps({
      upserts: { ...pending.upserts, [productId]: { productId, quantity } },
      removals: (pending.removals || []).filter((id) => id !== productId),
    });

    if (debounceTimers.current[productId]) clearTimeout(debounceTimers.current[productId]);

    debounceTimers.current[productId] = setTimeout(async () => {
      if (!isBrowserOnline()) return;

      setBusyAction(`${productId}:sync`);
      try {
        await api.put("/cart/update", { product: productId, quantity });
        const currentPending = getPendingOps();
        const { [productId]: _done, ...restUpserts } = currentPending.upserts || {};
        savePendingOps({ ...currentPending, upserts: restUpserts });
      } catch (err) {
        syncItems(previousItems);
        window.dispatchEvent(new CustomEvent("cart:quantity-changed", { detail: { productId, quantity: itemQuantity } }));
        toast.error(err.message || "Unable to update cart");
      } finally {
        setBusyAction("");
      }
    }, SYNC_DELAY);
  }, [syncItems]);

  const updateQuantity = useCallback(async (event, item, nextQuantity) => {
    event?.preventDefault();
    const productId = item.product?._id;
    if (!productId) return;

    if (nextQuantity <= 0) {
      return;
    }

    const previousItems = items;
    const nextItems = items.map((cartItem) =>
      cartItem.product?._id === productId ? { ...cartItem, quantity: nextQuantity } : cartItem
    );

    syncItems(nextItems);
    window.dispatchEvent(new CustomEvent("cart:quantity-changed", { detail: { productId, quantity: nextQuantity } }));
    queueQuantitySync(productId, nextQuantity, previousItems, item.quantity);
  }, [items, queueQuantitySync, syncItems]);

  const handleIncrease = useCallback((event, item) => {
    updateQuantity(event, item, Number(item.quantity || 1) + 1);
  }, [updateQuantity]);

  const handleRemove = useCallback(async (event, item) => {
    event?.preventDefault();
    const productId = item.product?._id;
    if (!productId) return;

    const previousItems = items;
    const nextItems = items.filter((cartItem) => cartItem.product?._id !== productId);

    syncItems(nextItems);
    window.dispatchEvent(new CustomEvent("cart:item-removed", { detail: { productId } }));
    setBusyAction(`${itemKey(item)}:remove`);

    const pending = getPendingOps();
    const { [productId]: _removed, ...restUpserts } = pending.upserts || {};
    savePendingOps({
      upserts: restUpserts,
      removals: [...(pending.removals || []), productId],
    });

    if (debounceTimers.current[productId]) clearTimeout(debounceTimers.current[productId]);

    if (!isBrowserOnline()) {
      setBusyAction("");
      return;
    }

    try {
      if (item._id) {
        try {
          await api.delete(`/cart/remove-item/${item._id}`);
        } catch (error) {
          if (error.response?.status !== 404) throw error;
          await api.delete(`/cart/remove/${productId}`);
        }
      } else {
        await api.delete(`/cart/remove/${productId}`);
      }
      toast.success("Removed from cart");
      const currentPending = getPendingOps();
      savePendingOps({
        upserts: currentPending.upserts || {},
        removals: (currentPending.removals || []).filter((id) => id !== productId),
      });
    } catch (err) {
      syncItems(previousItems);
      window.dispatchEvent(new CustomEvent("cart:quantity-changed", { detail: { productId, quantity: item.quantity } }));
      toast.error(err.message || "Unable to remove item");
    } finally {
      setBusyAction("");
    }
  }, [items, syncItems]);

  const handleDecrease = useCallback((event, item) => {
    const nextQuantity = Number(item.quantity || 1) - 1;
    if (nextQuantity <= 0) {
      return handleRemove(event, item);
    }
    return updateQuantity(event, item, nextQuantity);
  }, [handleRemove, updateQuantity]);

  return (
    <div className="grid w-full max-w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
      <section className="min-w-0">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Shopping cart</p>
          <h1 className="mt-2 break-words text-3xl font-bold text-slate-950 dark:text-slate-50">Review your items</h1>
        </div>

        {!isOnline && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            You are offline. Cart changes are saved locally and will sync when you reconnect.
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => <CartSkeleton key={index} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-slate-600 dark:text-slate-300">Your cart is empty.</p>
            <Link to="/" className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem
                key={itemKey(item)}
                item={item}
                busyAction={busyAction}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </section>

      <aside className="h-max min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-800 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Order summary</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2 text-slate-600 dark:text-slate-300"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex flex-wrap justify-between gap-2 text-slate-600 dark:text-slate-300"><span>Shipping</span><span>Free</span></div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 text-lg font-semibold dark:border-slate-700"><span>Total</span><span>₹{subtotal}</span></div>
        </div>
        <Link to="/checkout" className={`mt-5 flex w-full justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white ${items.length ? "bg-blue-600 hover:bg-blue-700" : "pointer-events-none bg-slate-300 dark:bg-slate-700"}`}>
          Checkout
        </Link>
      </aside>
    </div>
  );
}
