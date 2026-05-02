import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Icon from "../components/Icon";
import ProductCard from "../components/ProductCard";
import Skeleton from "../components/Skeleton";
import { useTheme } from "../context/ThemeContext";
import { loginSuccess } from "../features/auth/authSlice";
import useLocalStorage from "../hooks/useLocalStorage";
import api from "../services/api";
import { getAuthToken } from "../utils/storage";
import { normalizeWishlist } from "../utils/normalize";

const inputClass = "focus-blue w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800";
const emptyAddress = { id: "", fullName: "", mobile: "", email: "", house: "", street: "", landmark: "", city: "", district: "", state: "", country: "India", pincode: "", type: "Home", isDefault: false };
const emptyPayment = { id: "", type: "Card", label: "", detail: "", isDefault: false };

const statusClass = (status) => {
  if (status === "delivered" || status === "completed") return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-sky-300 dark:ring-blue-500/20";
  if (status === "shipped" || status === "processing") return "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20";
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600";
};

const digitsOnly = (value) => value.replace(/\D/g, "");
const createId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

function Field({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function AddressManager({ addresses, setAddresses }) {
  const [draft, setDraft] = useState(emptyAddress);

  const saveAddress = () => {
    if (!draft.fullName || !draft.house || !draft.city || !/^[6-9]\d{9}$/.test(draft.mobile) || !/^\d{6}$/.test(draft.pincode)) {
      toast.error("Please complete name, mobile, house, city and pincode");
      return;
    }
    const id = draft.id || createId();
    const nextAddress = { ...draft, id, isDefault: draft.isDefault || addresses.length === 0 };
    setAddresses((current) => {
      const next = current.some((address) => address.id === id)
        ? current.map((address) => (address.id === id ? nextAddress : address))
        : [...current, nextAddress];
      return nextAddress.isDefault ? next.map((address) => ({ ...address, isDefault: address.id === id })) : next;
    });
    setDraft(emptyAddress);
    toast.success("Address saved");
  };

  return (
    <div className="grid w-full max-w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)]">
      <section className={`${panelClass} min-w-0`}>
        <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Address management</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Full name"><input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className={inputClass} /></Field>
          <Field label="Mobile"><input value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: digitsOnly(e.target.value).slice(0, 10) })} className={inputClass} /></Field>
          <Field label="Email"><input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass} /></Field>
          <Field label="House / Flat"><input value={draft.house} onChange={(e) => setDraft({ ...draft, house: e.target.value })} className={inputClass} /></Field>
          <Field label="Street"><input value={draft.street} onChange={(e) => setDraft({ ...draft, street: e.target.value })} className={inputClass} /></Field>
          <Field label="Landmark"><input value={draft.landmark} onChange={(e) => setDraft({ ...draft, landmark: e.target.value })} className={inputClass} /></Field>
          <Field label="City"><input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className={inputClass} /></Field>
          <Field label="District"><input value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} className={inputClass} /></Field>
          <Field label="State"><input value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} className={inputClass} /></Field>
          <Field label="Country"><input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputClass} /></Field>
          <Field label="Pincode"><input value={draft.pincode} onChange={(e) => setDraft({ ...draft, pincode: digitsOnly(e.target.value).slice(0, 6) })} className={inputClass} /></Field>
          <Field label="Address type"><select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className={inputClass}><option>Home</option><option>Work</option><option>Other</option></select></Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })} className="h-4 w-4 accent-blue-600" />
          Make default address
        </label>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={saveAddress} className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto">Save address</button>
          <button type="button" onClick={() => setDraft(emptyAddress)} className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 sm:w-auto">New</button>
        </div>
      </section>

      <section className="space-y-3">
        {addresses.length === 0 ? (
          <div className={panelClass}><p className="text-sm text-slate-500 dark:text-slate-300">No saved addresses yet.</p></div>
        ) : (
          addresses.map((address) => (
            <article key={address.id} className={panelClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950 dark:text-slate-50">{address.fullName}</p>
                  <p className="text-xs font-bold text-blue-600 dark:text-sky-300">{address.type}{address.isDefault ? " • Default" : ""}</p>
                </div>
                <Icon name="location" className="h-5 w-5 text-blue-600 dark:text-sky-300" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{address.house}, {address.street}, {address.city}, {address.state} - {address.pincode}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setDraft(address)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">Edit</button>
                <button type="button" onClick={() => setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === address.id })))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">Default</button>
                <button type="button" onClick={() => setAddresses((current) => current.filter((item) => item.id !== address.id))} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 dark:border-rose-500/30">Delete</button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default function Profile() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("info");
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useLocalStorage("profile:image", "");
  const [addresses, setAddresses] = useLocalStorage("profile:addresses", []);
  const [paymentMethods, setPaymentMethods] = useLocalStorage("profile:payment-methods", [
    { id: "demo-card", type: "Card", label: "Visa ending 4242", detail: "Default checkout card", isDefault: true },
  ]);
  const [notifications, setNotifications] = useLocalStorage("profile:notifications", { email: true, sms: false, push: true });
  const [language, setLanguage] = useLocalStorage("profile:language", "English");
  const [paymentDraft, setPaymentDraft] = useState(emptyPayment);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    dob: user?.dob || "",
    address: user?.address || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const navItems = useMemo(
    () => [
      ["info", "Personal Info", "user"],
      ["addresses", "Addresses", "location"],
      ["orders", "Order History", "orders"],
      ["wishlist", "Wishlist", "heart"],
      ["payments", "Payments", "card"],
      ["security", "Security", "shield"],
      ["notifications", "Notifications", "bell"],
      ["preferences", "Preferences", "settings"],
    ],
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "phone" ? digitsOnly(value).slice(0, 10) : value }));
  };

  const loadWishlist = async () => {
    if (!getAuthToken()) return;
    try {
      setWishlistLoading(true);
      const res = await api.get("/wishlist");
      setWishlist(normalizeWishlist(res.data));
    } catch {
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!getAuthToken()) return;
    try {
      setOrdersLoading(true);
      const res = await api.get("/orders/my");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadOrders();
      loadWishlist();
    });
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) return toast.error("Enter a valid phone number");
    if (form.newPassword && form.newPassword !== form.confirmPassword) return toast.error("Passwords do not match");
    setSaving(true);

    try {
      const profileRes = await api.put("/v1/users/me", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        address: form.address,
      });

      const updatedUser = profileRes.data?.data || profileRes.data?.user || {
        ...user,
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
      };

      if (form.oldPassword && form.newPassword) {
        await api.put("/v1/users/change-password", {
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        });
      }

      dispatch(loginSuccess({ user: updatedUser, token }));
      toast.success("Profile updated");
      setForm((current) => ({ ...current, oldPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

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

  const handleRemoveWishlist = async (product) => {
    const previousWishlist = wishlist;
    setWishlist((current) => current.filter((item) => item._id !== product._id));
    try {
      await api.delete(`/wishlist/remove/${product._id}`);
      await loadWishlist();
      toast.success("Removed from wishlist");
    } catch (err) {
      setWishlist(previousWishlist);
      toast.error(err.message || "Unable to remove item");
    }
  };

  const savePayment = () => {
    if (!paymentDraft.label || !paymentDraft.detail) return toast.error("Add payment label and detail");
    const id = paymentDraft.id || createId();
    const nextPayment = { ...paymentDraft, id, isDefault: paymentDraft.isDefault || paymentMethods.length === 0 };
    setPaymentMethods((current) => {
      const next = current.some((method) => method.id === id)
        ? current.map((method) => (method.id === id ? nextPayment : method))
        : [...current, nextPayment];
      return nextPayment.isDefault ? next.map((method) => ({ ...method, isDefault: method.id === id })) : next;
    });
    setPaymentDraft(emptyPayment);
    toast.success("Payment method saved");
  };

  const strength = passwordStrength(form.newPassword);
  const activeTitle = navItems.find(([id]) => id === activeSection)?.[1];

  return (
    <div className="grid w-full max-w-full gap-6 overflow-hidden lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
      <aside className="h-max rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:sticky lg:top-24">
        <div className="mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-blue-600 text-lg font-bold text-white">
              {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : (user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-slate-950 dark:text-slate-50">{user?.name || "User"}</h2>
              <p className="truncate text-sm text-slate-500 dark:text-slate-300">{user?.email || "No email added"}</p>
            </div>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:block lg:space-y-2">
          {navItems.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold sm:text-sm ${
                activeSection === id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <Icon name={icon} className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Profile</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{activeTitle}</h1>
        </div>

        {activeSection === "info" && (
          <form onSubmit={handleSave} className={panelClass}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-blue-600 text-2xl font-bold text-white">
                {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : (form.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 sm:w-auto">
                <Icon name="upload" className="h-5 w-5" />
                Upload image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Your name" /></Field>
              <Field label="Email"><input name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="Email" /></Field>
              <Field label="Phone"><input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="10 digit phone" /></Field>
              <Field label="Gender"><select name="gender" value={form.gender} onChange={handleChange} className={inputClass}><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></Field>
              <Field label="Date of birth"><input name="dob" type="date" value={form.dob} onChange={handleChange} className={inputClass} /></Field>
              <Field label="Default address"><input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Short address note" /></Field>
            </div>
            <button disabled={saving} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        )}

        {activeSection === "addresses" && <AddressManager addresses={addresses} setAddresses={setAddresses} />}

        {activeSection === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40" />)
            ) : orders.length === 0 ? (
              <div className={`${panelClass} text-center text-slate-500 dark:text-slate-300`}>No orders found.</div>
            ) : (
              orders.map((order) => (
                <article key={order._id} className={panelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-950 dark:text-slate-50">Order #{order._id}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`w-full rounded-full px-3 py-1 text-center text-xs font-semibold capitalize ring-1 sm:w-auto ${statusClass(order.status)}`}>{order.status || "placed"}</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-300">{order.items?.length || 0} items</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-sky-400">₹{order.total || order.totalPrice || order.totalAmount || 0}</span>
                    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                      <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-700"><Icon name="invoice" className="mr-2 inline h-4 w-4" />Invoice</button>
                      <button type="button" className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-950"><Icon name="truck" className="mr-2 inline h-4 w-4" />Track</button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {activeSection === "wishlist" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {wishlistLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80" />)
            ) : wishlist.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:col-span-3">No wishlist products yet.</div>
            ) : (
              wishlist.map((product) => <ProductCard key={product._id} product={product} onAdd={handleAdd} onToggleWishlist={handleRemoveWishlist} wished />)
            )}
          </div>
        )}

        {activeSection === "payments" && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)]">
            <section className={panelClass}>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Saved payment methods</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Type"><select value={paymentDraft.type} onChange={(e) => setPaymentDraft({ ...paymentDraft, type: e.target.value })} className={inputClass}><option>Card</option><option>UPI</option><option>Wallet</option><option>Net banking</option></select></Field>
                <Field label="Label"><input value={paymentDraft.label} onChange={(e) => setPaymentDraft({ ...paymentDraft, label: e.target.value })} className={inputClass} placeholder="Visa ending 1234" /></Field>
                <Field label="Detail"><input value={paymentDraft.detail} onChange={(e) => setPaymentDraft({ ...paymentDraft, detail: e.target.value })} className={inputClass} placeholder="Short private note" /></Field>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={paymentDraft.isDefault} onChange={(e) => setPaymentDraft({ ...paymentDraft, isDefault: e.target.checked })} className="h-4 w-4 accent-blue-600" />Default payment method</label>
              <button type="button" onClick={savePayment} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700">Save payment</button>
            </section>
            <section className="space-y-3">
              {paymentMethods.map((method) => (
                <article key={method.id} className={panelClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-bold text-slate-950 dark:text-slate-50">{method.label}</p><p className="text-sm text-slate-500 dark:text-slate-300">{method.type} • {method.detail}</p></div>
                    <Icon name={method.type === "Card" ? "card" : "wallet"} className="h-5 w-5 text-blue-600 dark:text-sky-300" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPaymentMethods((current) => current.map((item) => ({ ...item, isDefault: item.id === method.id })))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">{method.isDefault ? "Default" : "Make default"}</button>
                    <button type="button" onClick={() => setPaymentMethods((current) => current.filter((item) => item.id !== method.id))} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 dark:border-rose-500/30">Delete</button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}

        {activeSection === "security" && (
          <form onSubmit={handleSave} className={panelClass}>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Security</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Current password"><input name="oldPassword" type="password" value={form.oldPassword} onChange={handleChange} className={inputClass} placeholder="Required to change password" /></Field>
              <Field label="New password"><input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} className={inputClass} placeholder="New password" /></Field>
              <Field label="Confirm password"><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Confirm password" /></Field>
            </div>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(strength / 4) * 100}%` }} /></div>
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">Password strength: {["Empty", "Weak", "Fair", "Good", "Strong"][strength]}</p>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Two-factor authentication structure is ready for backend OTP or authenticator app integration.
            </div>
            <button disabled={saving} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Update security"}</button>
          </form>
        )}

        {activeSection === "notifications" && (
          <section className={panelClass}>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Notifications</h2>
            <div className="mt-4 space-y-3">
              {["email", "sms", "push"].map((key) => (
                <label key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-sm font-bold capitalize text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {key} notifications
                  <input type="checkbox" checked={notifications[key]} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} className="h-5 w-5 accent-blue-600" />
                </label>
              ))}
            </div>
          </section>
        )}

        {activeSection === "preferences" && (
          <section className={panelClass}>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Preferences</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Theme</p>
                <button type="button" onClick={toggleTheme} className="mt-3 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto">{theme === "dark" ? "Switch to light" : "Switch to dark"}</button>
              </div>
              <Field label="Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Kannada</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                </select>
              </Field>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
