import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

const getOrdersArray = (data) => data?.data?.orders || data?.orders || data?.data || data || [];
const orderEndpoints = ["/orders", "/v1/admin/orders"];
const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const normalizeStatus = (status) => {
  const value = String(status || "Pending").toLowerCase();
  return statusOptions.find((option) => option.toLowerCase() === value) || "Pending";
};

const requestWithFallback = async (method, paths, data) => {
  let lastError;

  for (const path of paths) {
    try {
      return await api[method](path, data);
    } catch (error) {
      lastError = error;
      if (error.response?.status !== 404) throw error;
    }
  }

  throw lastError;
};

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrdersEndpoint, setActiveOrdersEndpoint] = useState("/orders");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await requestWithFallback("get", orderEndpoints);
      setActiveOrdersEndpoint(res.config.url);
      setOrders(Array.isArray(getOrdersArray(res.data)) ? getOrdersArray(res.data) : []);
    } catch {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(fetchOrders);
  }, []);

  const updateStatus = async (id, status) => {
    const normalizedStatus = normalizeStatus(status);

    try {
      await requestWithFallback("put", [
        `/orders/${id}`,
        `${activeOrdersEndpoint}/${id}`,
      ], { status: normalizedStatus });
      toast.success("Status updated");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const canDeleteOrder = (order) => {
    return normalizeStatus(order.status) === "Delivered";
  };

  const deleteOrder = async (order) => {
    if (!canDeleteOrder(order)) {
      toast.error("Only delivered orders can be deleted");
      return;
    }

    const confirmed = window.confirm(
      "Delete this delivered order permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await requestWithFallback("delete", [
        `/orders/${order._id}`,
        `/v1/admin/orders/${order._id}`,
      ]);
      setOrders((current) => current.filter((item) => item._id !== order._id));
      toast.success("Delivered order deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Operations</p>
        <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">Order Management</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4 text-left">Order ID</th>
                <th className="text-left">User</th>
                <th className="text-left">Total</th>
                <th className="text-left">Status</th>
                <th className="text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">No orders found.</td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o._id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 font-medium text-slate-200">{o._id}</td>
                  <td className="text-slate-300">{o.user?.name}</td>
                  <td className="font-semibold text-sky-400">₹{o.totalAmount || o.totalPrice || o.total}</td>
                  <td>
                    <select
                      value={normalizeStatus(o.status)}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      disabled={canDeleteOrder(o)}
                      title={canDeleteOrder(o) ? "Delivered orders are locked. Delete is now available." : "Update order status"}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteOrder(o)}
                      disabled={!canDeleteOrder(o)}
                      title={canDeleteOrder(o) ? "Delete delivered order" : "Delete enables after Delivered status"}
                      className={`rounded-xl px-3 py-2 font-semibold ${
                        canDeleteOrder(o)
                          ? "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-white"
                          : "cursor-not-allowed border border-slate-800 text-slate-600"
                      }`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {loading ? (
            <p className="p-4 text-center text-slate-400">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-4 text-center text-slate-400">No orders found.</p>
          ) : orders.map((order) => (
            <article key={order._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</p>
                  <p className="break-all text-sm font-bold text-slate-100">{order._id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User</p>
                    <p className="break-words text-sm text-slate-300">{order.user?.name || "User"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                    <p className="text-sm font-bold text-sky-400">₹{order.totalAmount || order.totalPrice || order.total}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <select
                  value={normalizeStatus(order.status)}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  disabled={canDeleteOrder(order)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button
                  onClick={() => deleteOrder(order)}
                  disabled={!canDeleteOrder(order)}
                  className={`w-full rounded-xl px-3 py-3 text-sm font-semibold ${
                    canDeleteOrder(order)
                      ? "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-white"
                      : "cursor-not-allowed border border-slate-800 text-slate-600"
                  }`}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
