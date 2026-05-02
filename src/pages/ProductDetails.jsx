import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Skeleton from "../components/Skeleton";
import api from "../services/api";
import { PLACEHOLDER_IMAGE } from "../config/env";
import { safeImageUrl } from "../utils/security";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data?.product || res.data?.data || res.data);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    Promise.resolve().then(loadProduct);
  }, [id]);

  const handleAdd = async () => {
    if (!product?._id) return;
    try {
      window.dispatchEvent(new CustomEvent("cart:optimistic-add", { detail: { product } }));
      await api.post("/cart/add", { product: product._id, quantity: 1 });
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Added to cart");
    } catch (err) {
      window.dispatchEvent(new Event("cart:updated"));
      toast.error(err.message || "Unable to add item");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!product?._id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Product not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">The product may be unavailable or removed.</p>
        <Link to="/" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <img
          src={safeImageUrl(product.image, PLACEHOLDER_IMAGE)}
          alt={product.name}
          className="aspect-square w-full object-cover"
        />
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-sky-400">{product.category || "Featured"}</p>
        <h1 className="mt-3 break-words text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl lg:text-4xl">{product.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold text-blue-600 dark:text-sky-400">₹{product.price}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            In stock
          </span>
        </div>

        <p className="mt-5 break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
          {product.description || "A carefully selected product from the ShopEase catalog."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={handleAdd} className="w-full gap-2 py-3">
            <Icon name="cart" className="h-5 w-5" />
            Add to cart
          </Button>
          <Link to="/cart" className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            View cart
          </Link>
        </div>
      </section>
    </div>
  );
}
