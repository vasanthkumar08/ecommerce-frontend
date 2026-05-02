import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../components/Icon";
import { OrderSkeleton } from "../components/Skeleton";
import { PLACEHOLDER_IMAGE } from "../config/env";
import api from "../services/api";
import { getAuthToken } from "../utils/storage";
import { safeImageUrl } from "../utils/security";

const trackingSteps = [
  "Order Placed",
  "Payment Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
];

const statusIndex = {
  pending: 0,
  placed: 0,
  paid: 1,
  confirmed: 1,
  processing: 2,
  packed: 3,
  shipped: 4,
  "out for delivery": 5,
  out_for_delivery: 5,
  delivered: 6,
  completed: 6,
};

const statusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "delivered" || normalized === "completed") return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-sky-300 dark:ring-blue-500/20";
  if (normalized === "shipped" || normalized === "processing" || normalized === "packed") return "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20";
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600";
};

const money = (value) => `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
const orderId = (order) => order._id || order.id || order.orderId || "unknown";
const orderDate = (order) => order.createdAt || order.orderDate || order.date || new Date().toISOString();
const orderTotal = (order) => order.total || order.totalPrice || order.totalAmount || order.amount || 0;
const paymentMethod = (order) => order.paymentMethod || order.payment?.method || "Cash on Delivery";
const paymentStatus = (order) => {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.isPaid) return "Paid";
  return String(paymentMethod(order)).toLowerCase().includes("cash") ? "Pending" : "Paid";
};

const normalizeItem = (item = {}) => {
  const product = item.product && typeof item.product === "object" ? item.product : {};
  return {
    id: item._id || item.id || product._id || product.id || item.name,
    name: item.name || product.name || item.productName || "Product",
    image: item.image || product.image || product.images?.[0]?.url || "",
    quantity: Number(item.quantity || item.qty || 1),
    price: Number(item.price || product.price || item.totalPrice || 0),
  };
};

const normalizeAddress = (order = {}) => {
  const address = order.shippingAddress || order.deliveryAddress || order.address || {};
  if (typeof address === "string") return address;

  return [
    address.fullName || address.name,
    address.address,
    address.house,
    address.street,
    address.landmark,
    address.city,
    address.district,
    address.state,
    address.pincode,
    address.country,
  ].filter(Boolean).join(", ") || "Address not available";
};

const normalizeOrders = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : payload?.orders || payload?.data?.orders || payload?.data || [];

  return (Array.isArray(list) ? list : [])
    .map((order) => ({
      ...order,
      _normalizedId: orderId(order),
      _items: (order.items || order.orderItems || order.products || []).map(normalizeItem),
      _address: normalizeAddress(order),
    }))
    .sort((a, b) => new Date(orderDate(b)).getTime() - new Date(orderDate(a)).getTime());
};

const activeStepIndex = (order, tracking) => {
  if (Array.isArray(tracking?.steps)) {
    const completed = tracking.steps.filter((step) => step.completed || step.done || step.status === "completed").length;
    return Math.max(0, completed - 1);
  }

  const normalized = String(tracking?.status || order.status || "placed").toLowerCase();
  return statusIndex[normalized] ?? 0;
};

const pdfEscape = (value) => String(value || "").replace(/[\\()]/g, "\\$&");

const createInvoicePdf = (order) => {
  const id = orderId(order);
  const items = order._items?.length ? order._items : (order.items || []).map(normalizeItem);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Number(orderTotal(order) || subtotal);
  const tax = Math.max(total - subtotal, 0);
  const lines = [
    "ShopEase Invoice",
    `Order ID: ${id}`,
    `Customer: ${order.customerName || order.user?.name || order.shippingAddress?.fullName || "Customer"}`,
    `Address: ${normalizeAddress(order)}`,
    `Payment Method: ${paymentMethod(order)}`,
    `Payment Status: ${paymentStatus(order)}`,
    `Order Date: ${new Date(orderDate(order)).toLocaleString()}`,
    "",
    "Products",
    ...items.map((item) => `${item.name} | Qty: ${item.quantity} | Price: Rs. ${item.price}`),
    "",
    `Tax: Rs. ${Math.round(tax)}`,
    `Total: Rs. ${Math.round(total)}`,
  ].slice(0, 34);

  const content = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "/F1 18 Tf" : index === 1 ? "/F1 12 Tf" : "",
      `(${pdfEscape(line)}) Tj`,
      "0 -22 Td",
    ]).filter(Boolean),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [tracking, setTracking] = useState({});
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      if (!getAuthToken()) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get("/orders/my");
        setOrders(normalizeOrders(res.data));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const orderCount = useMemo(() => orders.length, [orders]);

  const toggleTracking = async (order) => {
    const id = orderId(order);
    setExpanded((current) => ({ ...current, [id]: !current[id] }));

    if (tracking[id]) return;

    try {
      const res = await api.get(`/orders/${id}/track`);
      setTracking((current) => ({ ...current, [id]: res.data || { status: order.status } }));
    } catch {
      setTracking((current) => ({ ...current, [id]: { status: order.status || "placed" } }));
    }
  };

  const downloadInvoice = async (order) => {
    const id = orderId(order);
    const filename = `invoice-${id}.pdf`;

    try {
      setDownloading(id);
      const res = await api.get(`/orders/${id}/invoice`, { responseType: "blob" });
      const type = res.data?.type || "";

      if (type.includes("pdf")) {
        downloadBlob(res.data, filename);
      } else {
        downloadBlob(createInvoicePdf(order), filename);
      }

      toast.success("Invoice downloaded");
    } catch {
      downloadBlob(createInvoicePdf(order), filename);
      toast.success("Invoice downloaded");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Orders</p>
          <h1 className="mt-2 break-words text-2xl font-bold text-slate-950 dark:text-slate-50 sm:text-3xl">Order history</h1>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
          {orderCount} {orderCount === 1 ? "order" : "orders"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => <OrderSkeleton key={index} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const id = orderId(order);
            const items = order._items?.length ? order._items : [{ id: `${id}-empty`, name: "Products unavailable", image: "", quantity: 1, price: orderTotal(order) }];
            const currentTracking = tracking[id];
            const activeIndex = activeStepIndex(order, currentTracking);

            return (
              <article key={id} className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
                <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-bold text-slate-950 dark:text-slate-50">Order #{id}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{new Date(orderDate(order)).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                    <span className={`rounded-full px-3 py-1 text-center text-xs font-semibold capitalize ring-1 ${statusClass(order.status)}`}>
                      {order.status || "Placed"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-center text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                      {paymentStatus(order)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
                      <img src={safeImageUrl(item.image, PLACEHOLDER_IMAGE)} alt={item.name} className="h-16 w-16 rounded-xl object-cover sm:h-18 sm:w-18" />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-slate-950 dark:text-slate-50">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Qty: {item.quantity}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 sm:hidden">{money(item.price * item.quantity)}</p>
                      </div>
                      <p className="hidden self-center text-sm font-bold text-blue-600 dark:text-sky-300 sm:block">{money(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-700 md:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Delivery address</dt>
                    <dd className="mt-1 break-words text-slate-700 dark:text-slate-200">{order._address}</dd>
                  </div>
                  <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Payment method</dt>
                      <dd className="mt-1 text-slate-700 dark:text-slate-200">{paymentMethod(order)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Total price</dt>
                      <dd className="mt-1 text-lg font-bold text-blue-600 dark:text-sky-300">{money(orderTotal(order))}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                  <button onClick={() => toggleTracking(order)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto">
                    <Icon name="truck" className="h-4 w-4" />
                    Track Order
                  </button>
                  <button onClick={() => downloadInvoice(order)} disabled={downloading === id} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-sky-300 sm:w-auto">
                    <Icon name="invoice" className="h-4 w-4" />
                    {downloading === id ? "Preparing..." : "Download Invoice"}
                  </button>
                </div>

                {expanded[id] && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                      {trackingSteps.map((step, index) => {
                        const complete = index <= activeIndex;
                        return (
                          <div key={step} className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-start">
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${complete ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"}`}>
                              {complete ? <Icon name="check" className="h-4 w-4" /> : index + 1}
                            </span>
                            <span className={`break-words text-sm font-semibold ${complete ? "text-slate-950 dark:text-slate-50" : "text-slate-500 dark:text-slate-400"}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
