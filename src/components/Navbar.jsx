import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { logout } from "../features/auth/authSlice";
import { useTheme } from "../context/ThemeContext";
import { GET_PRODUCTS } from "../graphql/operations";
import useDebounce from "../hooks/useDebounce";
import api from "../services/api";
import { getAuthToken, getJson, setJson } from "../utils/storage";
import { getProductList, normalizeCart } from "../utils/normalize";
import Icon from "./Icon";
import SearchBar from "./SearchBar";

const CART_CACHE_KEY = "cart:cache";
const CART_PENDING_KEY = "cart:pending";

const writeCartCache = (updater) => {
  const current = getJson(CART_CACHE_KEY, []);
  const next = typeof updater === "function" ? updater(Array.isArray(current) ? current : []) : updater;
  setJson(CART_CACHE_KEY, next);
};

const queueCartUpsert = (productId, quantity) => {
  if (!productId) return;
  const pending = getJson(CART_PENDING_KEY, { upserts: {}, removals: [] });
  setJson(CART_PENDING_KEY, {
    upserts: { ...(pending.upserts || {}), [productId]: { productId, quantity } },
    removals: (pending.removals || []).filter((id) => id !== productId),
  });
};

const syncPendingCart = async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const pending = getJson(CART_PENDING_KEY, { upserts: {}, removals: [] });
  const removals = Array.from(new Set(pending.removals || []));
  const upserts = Object.values(pending.upserts || {});

  if (!removals.length && !upserts.length) return;

  const removalResults = await Promise.allSettled(removals.map((productId) => api.delete(`/cart/remove/${productId}`)));
  const upsertResults = await Promise.allSettled(upserts.map((item) => api.put("/cart/update", {
    product: item.productId,
    quantity: item.quantity,
  })));
  const failedRemovals = removals.filter((_, index) => removalResults[index]?.status === "rejected");
  const failedUpserts = upserts.filter((_, index) => upsertResults[index]?.status === "rejected");

  setJson(CART_PENDING_KEY, {
    upserts: failedUpserts.reduce((acc, item) => ({ ...acc, [item.productId]: item }), {}),
    removals: failedRemovals,
  });
};

export default function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const fallbackCart = useSelector((state) => state.cart.items || []);
  const { data: productsData } = useQuery(GET_PRODUCTS);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [cartItems, setCartItems] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const cartCount =
    cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0) ||
    fallbackCart.length;
  const suggestions = useMemo(() => getProductList(productsData), [productsData]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") || "";
    if (debouncedSearch.trim() === currentQuery.trim()) return;

    const next = new URLSearchParams(searchParams);

    if (debouncedSearch.trim()) {
      next.set("q", debouncedSearch.trim());
    } else {
      next.delete("q");
    }

    navigate({ pathname: "/", search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  }, [debouncedSearch, navigate, searchParams]);

  useEffect(() => {
    if (!getAuthToken()) return;

    const loadCart = async () => {
      const cached = getJson(CART_CACHE_KEY, []);
      if (typeof navigator !== "undefined" && !navigator.onLine && Array.isArray(cached)) {
        setCartItems(cached);
        return;
      }

      try {
        const res = await api.get("/cart");
        const next = normalizeCart(res.data);
        setCartItems(next);
        writeCartCache(next);
      } catch {
        setCartItems(Array.isArray(cached) ? cached : []);
      }
    };
    const clearCartBadge = () => setCartItems([]);
    const handleOptimisticAdd = (event) => {
      const product = event.detail?.product;
      if (!product?._id) return;

      setCartItems((current) => {
        const existing = current.find((item) => item.product?._id === product._id);

        if (existing) {
          const next = current.map((item) =>
            item.product?._id === product._id
              ? { ...item, quantity: Number(item.quantity || 1) + 1 }
              : item
          );
          const updated = next.find((item) => item.product?._id === product._id);
          queueCartUpsert(product._id, Number(updated?.quantity || 1));
          writeCartCache(next);
          return next;
        }

        const next = [...current, { product, quantity: 1 }];
        queueCartUpsert(product._id, 1);
        writeCartCache(next);
        return next;
      });
    };
    const handleQuantityChange = (event) => {
      const { productId, quantity } = event.detail || {};
      if (!productId) return;

      setCartItems((current) => {
        const next = current
          .map((item) =>
            item.product?._id === productId
              ? { ...item, quantity: Math.max(0, Number(quantity || 0)) }
              : item
          )
          .filter((item) => Number(item.quantity || 0) > 0);
        writeCartCache(next);
        return next;
      });
    };
    const handleItemRemoved = (event) => {
      const { productId } = event.detail || {};
      if (!productId) return;

      setCartItems((current) => {
        const next = current.filter((item) => item.product?._id !== productId);
        writeCartCache(next);
        return next;
      });
    };

    loadCart();
    window.addEventListener("online", syncPendingCart);
    window.addEventListener("cart:optimistic-add", handleOptimisticAdd);
    window.addEventListener("cart:quantity-changed", handleQuantityChange);
    window.addEventListener("cart:item-removed", handleItemRemoved);
    window.addEventListener("cart:cleared", clearCartBadge);
    window.addEventListener("cart:updated", loadCart);
    return () => {
      window.removeEventListener("online", syncPendingCart);
      window.removeEventListener("cart:optimistic-add", handleOptimisticAdd);
      window.removeEventListener("cart:quantity-changed", handleQuantityChange);
      window.removeEventListener("cart:item-removed", handleItemRemoved);
      window.removeEventListener("cart:cleared", clearCartBadge);
      window.removeEventListener("cart:updated", loadCart);
    };
  }, [user]);

  const iconButton =
    "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:h-11 sm:w-11";

  return (
    <nav className="sticky top-0 z-50 w-full max-w-full overflow-hidden border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
      <div className="app-container grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-3 sm:gap-3">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">S</span>
          <span className="hidden sm:inline">ShopEase</span>
        </Link>

        <div className="mx-auto hidden w-full min-w-0 max-w-2xl md:block">
          <SearchBar value={search} onSearch={setSearch} suggestions={suggestions} />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className={iconButton}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>

          <button onClick={() => navigate("/wishlist")} className={iconButton} aria-label="Open wishlist">
            <Icon name="heart" />
          </button>

          <button
            onClick={() => navigate("/cart")}
            className={iconButton}
            aria-label={`Open cart with ${cartCount} items`}
          >
            <Icon name="cart" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sky-400 px-1 text-xs font-bold text-slate-950">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate(user ? "/profile" : "/login")}
            className={iconButton}
            aria-label={user ? "Open profile" : "Login"}
          >
            <Icon name="user" />
          </button>

          {user && (
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:inline-flex"
            >
              Logout
            </button>
          )}

          <button
            onClick={() => setMenuOpen((current) => !current)}
            className={`${iconButton} md:hidden`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div className="w-full border-t border-slate-100 px-3 py-3 dark:border-slate-800 sm:px-4 md:hidden">
        <SearchBar value={search} onSearch={setSearch} suggestions={suggestions} />
      </div>

      {menuOpen && (
        <div className="w-full border-t border-slate-100 px-3 pb-3 dark:border-slate-800 sm:px-4 md:hidden">
          <div className="grid gap-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-950">
            {[
              ["Home", "/"],
              ["Wishlist", "/wishlist"],
              ["Cart", "/cart"],
              ["Orders", "/orders"],
              [user ? "Profile" : "Login", user ? "/profile" : "/login"],
            ].map(([label, path]) => (
              <button
                key={path}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(path);
                }}
                className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {label}
              </button>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  dispatch(logout());
                  navigate("/login");
                }}
                className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-600 hover:bg-white dark:text-rose-300 dark:hover:bg-slate-900"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
