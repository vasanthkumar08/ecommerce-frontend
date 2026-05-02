import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";
import { ProductSkeleton } from "../components/Skeleton";
import api from "../services/api";
import { normalizeWishlist } from "../utils/normalize";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      setProducts(normalizeWishlist(res.data));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadWishlist);
  }, []);

  const handleAdd = async (product) => {
    try {
      window.dispatchEvent(new CustomEvent("cart:optimistic-add", { detail: { product } }));
      await api.post("/cart/add", { product: product._id, quantity: 1 });
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.message || "Unable to add item");
    }
  };

  const handleRemove = async (product) => {
    const previousProducts = products;
    setProducts((current) => current.filter((item) => item._id !== product._id));

    try {
      await api.delete(`/wishlist/remove/${product._id}`);
      await loadWishlist();
      toast.success("Removed from wishlist");
    } catch (err) {
      setProducts(previousProducts);
      toast.error(err.message || "Unable to remove item");
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Wishlist</p>
        <h1 className="mt-2 break-words text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">Saved products</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-4 text-slate-600 dark:text-slate-300">No wishlist products yet.</p>
          <Link to="/" className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAdd={handleAdd}
              onToggleWishlist={handleRemove}
              wished
            />
          ))}
        </div>
      )}
    </div>
  );
}
