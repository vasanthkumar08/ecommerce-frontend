import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import CategoryBar from "./CategoryBar";
import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <CategoryBar />

      <main className="app-container min-w-0 pb-24 pt-5 md:pb-8 md:pt-6">
        <Outlet />
      </main>

      <MobileBottomNav />

      <footer className="hidden border-t border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:block">
        <div className="app-container py-6 md:grid md:grid-cols-4 md:gap-8 md:py-10">
          <div className="md:col-span-1">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold text-white">S</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">ShopEase</span>
            </div>
            <p className="mt-3 text-center leading-6 md:text-left">
              Secure shopping, fast delivery, trusted support.
            </p>
          </div>

          <div className="mt-6 hidden md:block">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">About</h3>
            <p className="mt-3 leading-6">Classic products, clean checkout, and dependable service for everyday shopping.</p>
          </div>

          <div className="mt-6 hidden md:block">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Links</h3>
            <div className="mt-3 grid gap-2">
              <Link className="hover:text-blue-600" to="/">Home</Link>
              <Link className="hover:text-blue-600" to="/cart">Cart</Link>
              <Link className="hover:text-blue-600" to="/orders">Orders</Link>
              <Link className="hover:text-blue-600" to="/profile">Profile</Link>
            </div>
          </div>

          <div className="mt-6 hidden md:block">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Contact</h3>
            <div className="mt-3 grid gap-2">
              <span>support@shopease.local</span>
              <span>Mon-Sat, 9 AM - 8 PM</span>
              <div className="mt-2 flex gap-2">
                {["f", "x", "in"].map((item) => (
                  <span key={item} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs md:col-span-4 md:mt-8 md:border-t md:border-slate-200 md:pt-5 dark:md:border-slate-800">
            ShopEase © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
