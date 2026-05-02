import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { lazy, Suspense } from "react";

import Layout from "../components/Layout";

const AdminLayout = lazy(() => import("../pages/admin/AdminLayout"));
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const Profile = lazy(() => import("../pages/Profile"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ProductManager = lazy(() => import("../pages/admin/ProductManager"));
const OrderManager = lazy(() => import("../pages/admin/OrderManager"));

function RouteLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center p-6 text-sm font-semibold text-slate-500 dark:text-slate-300">
      Loading...
    </div>
  );
}

export default function AppRoutes() {
  const user = useSelector((state) => state.auth.user);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* USER */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Navigate to="/profile" />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="wishlist" element={<Wishlist />} />
        </Route>

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" || user?.role === "superadmin"
              ? <AdminLayout />
              : <Navigate to="/login" />
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="orders" element={<OrderManager />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
