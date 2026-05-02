import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
  });

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await api.get("/products");
        const orderRes = await api.get("/orders");

        setProducts(prodRes.data);
        setOrders(orderRes.data);

        const totalRevenue = orderRes.data.reduce((sum, o) => sum + o.total, 0);

        setStats({
          products: prodRes.data.length,
          orders: orderRes.data.length,
          revenue: totalRevenue,
        });
      } catch {
        setProducts([]);
        setOrders([]);
      }
    };

    fetchData();
  }, []);

  const maxRevenue = Math.max(...orders.slice(0, 6).map((o) => o.total), 1);

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Overview</p>
        <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Total Products", stats.products],
          ["Total Orders", stats.orders],
          ["Revenue", `₹${stats.revenue}`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/10">
            <p className="text-sm text-slate-400">{label}</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{value}</h2>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-white">Revenue activity</h2>
          <span className="rounded-full bg-blue-600/15 px-3 py-1 text-xs font-semibold text-sky-300">Last orders</span>
        </div>
        <div className="flex h-48 min-w-0 items-end gap-2 sm:gap-3">
          {orders.slice(0, 6).map((order) => (
            <div key={order._id} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-blue-600 shadow-lg shadow-blue-950/40"
                style={{ height: `${Math.max((order.total / maxRevenue) * 100, 10)}%` }}
                title={`₹${order.total}`}
              />
              <span className="max-w-full truncate text-xs text-slate-500">{order._id.slice(-4)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
          <div className="border-b border-slate-800 p-4 font-bold text-white">Recent Orders</div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="text-left">User</th>
                  <th className="text-left">Total</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o._id} className="border-t border-slate-800">
                    <td className="p-3 font-medium text-slate-200">{o._id.slice(-6)}</td>
                    <td className="text-slate-300">{o.user?.name || "User"}</td>
                    <td className="font-semibold text-sky-400">₹{o.total}</td>
                    <td><span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {orders.slice(0, 5).length === 0 ? (
              <p className="p-3 text-center text-sm text-slate-400">No recent orders.</p>
            ) : orders.slice(0, 5).map((order) => (
              <article key={order._id} className="rounded-xl bg-slate-950 p-3">
                <p className="break-all text-sm font-bold text-slate-100">#{order._id}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-300">{order.user?.name || "User"}</span>
                  <span className="font-bold text-sky-400">₹{order.total}</span>
                </div>
                <span className="mt-3 inline-flex rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{order.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/10">
          <h2 className="font-bold text-white">Top Products</h2>
          <div className="mt-4 space-y-3">
            {products.slice(0, 4).map((p) => (
              <div key={p._id} className="flex items-center gap-3 rounded-xl bg-slate-950 p-3">
                <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-sm text-sky-400">₹{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
