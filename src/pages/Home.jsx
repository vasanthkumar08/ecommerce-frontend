import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";
import { ProductSkeleton } from "../components/Skeleton";
import api from "../services/api";
import { getAuthToken } from "../utils/storage";
import { HERO_IMAGE_URL } from "../config/env";
import { getProductList, normalizeWishlist } from "../utils/normalize";
import {
  GET_PRODUCTS,
} from "../graphql/operations";

const normalizeCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getCategoryTokens = (product) => {
  const values = [
    product.category,
    product.categoryName,
    product.type,
    product.department,
  ];

  return values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(normalizeCategory);
    return [normalizeCategory(value)];
  }).filter(Boolean);
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "";
  const [wishlistProducts, setWishlistProducts] = useState([]);

  const { data, loading, error } = useQuery(GET_PRODUCTS);

  const rawProducts = getProductList(data);
  const products = rawProducts.filter((product) => {
    const activeCategory = normalizeCategory(selectedCategory);
    const categoryTokens = getCategoryTokens(product);
    const matchesSearch = search
      ? product.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory = activeCategory
      ? categoryTokens.includes(activeCategory)
      : true;

    return matchesSearch && matchesCategory;
  });
  const isLoading = loading;
  const productError = error?.message;
  const wishlistIds = useMemo(
    () => new Set(wishlistProducts.map((product) => product._id)),
    [wishlistProducts]
  );

  useEffect(() => {
    document.title = "ShopEase | Modern E-commerce";
  }, []);

  const loadWishlist = async () => {
    if (!getAuthToken()) return;

    try {
      const res = await api.get("/wishlist");
      setWishlistProducts(normalizeWishlist(res.data));
    } catch {
      setWishlistProducts([]);
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
      window.dispatchEvent(new Event("cart:updated"));
      toast.error(err.message || "Login required to add to cart");
    }
  };

  const handleWishlist = async (product) => {
    try {
      if (wishlistIds.has(product._id)) {
        await api.delete(`/wishlist/remove/${product._id}`);
        toast.success("Removed from wishlist");
      } else {
        await api.post("/wishlist/add", { productId: product._id });
        toast.success("Added to wishlist");
      }
      await loadWishlist();
    } catch (err) {
      toast.error(err.message || "Login required for wishlist");
    }
  };

  const trending = products.slice(0, 8);
  const newArrivals = products.slice(4, 12);

  return (
    <div className="max-w-full space-y-8 md:space-y-10">
      <section className="max-w-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1.15fr_0.85fr] md:gap-8 md:p-10">
          <div className="flex min-w-0 flex-col justify-center">
            <p className="mb-4 inline-flex w-max max-w-full rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-slate-800 dark:text-sky-300">
              Trending · New · Sale
            </p>
            <h1 className="max-w-3xl break-words text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl md:text-6xl">
              Premium shopping, now powered by GraphQL.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Faster product discovery, wishlist saves, clean cart flows, and classic high-contrast design.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#featured" className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md sm:w-auto">
                Shop featured
              </a>
              <a href="#trending" className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto">
                View trending
              </a>
            </div>
          </div>
          <div className="min-w-0 rounded-3xl bg-slate-100 p-3 dark:bg-slate-800 sm:p-5">
            <img
              src={HERO_IMAGE_URL}
              alt="Modern shopping setup"
              className="h-auto max-h-80 w-full rounded-2xl object-cover shadow-sm"
            />
          </div>
        </div>
      </section>

      <section id="trending" className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Trending</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Side-scroll picks</h2>
        </div>
        <div className="scrollbar-hide flex max-w-full snap-x gap-4 overflow-x-auto scroll-smooth whitespace-nowrap pb-3">
          {(isLoading ? Array.from({ length: 5 }) : trending).map((product, index) => (
            <div key={product?._id || index} className="w-[min(16rem,78vw)] shrink-0 snap-start whitespace-normal">
              {isLoading ? <ProductSkeleton /> : (
                <ProductCard
                  product={product}
                  onAdd={handleAdd}
                  onToggleWishlist={handleWishlist}
                  wished={wishlistIds.has(product._id)}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">New Arrivals</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Fresh products</h2>
          </div>
          <div className="scrollbar-hide flex max-w-full gap-4 overflow-x-auto scroll-smooth whitespace-nowrap pb-3">
            {newArrivals.map((product) => (
              <div key={product._id} className="w-[min(16rem,78vw)] shrink-0 whitespace-normal">
                <ProductCard
                  product={product}
                  onAdd={handleAdd}
                  onToggleWishlist={handleWishlist}
                  wished={wishlistIds.has(product._id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="featured" className="space-y-5">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">
              Featured products
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">
              {search ? `Results for "${search}"` : selectedCategory ? `${selectedCategory} products` : "Best picks for today"}
            </h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Filters
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Sort: Featured
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)
            : productError ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  {productError}
                </div>
              )
            : products.length > 0 ? products.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item}
                  onAdd={handleAdd}
                  onToggleWishlist={handleWishlist}
                  wished={wishlistIds.has(item._id)}
                />
              )) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  No products found.
                </div>
              )}
        </div>
      </section>
    </div>
  );
}
