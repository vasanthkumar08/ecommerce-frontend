import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Icon from "../components/Icon";
import Skeleton from "../components/Skeleton";
import { clearCart } from "../features/cart/cartSlice";
import useLocalStorage from "../hooks/useLocalStorage";
import api from "../services/api";
import { normalizeCart } from "../utils/normalize";
import { getJson, storage } from "../utils/storage";

const inputClass = "focus-blue w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "space-y-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300";
const emptyAddress = {
  id: "",
  fullName: "",
  mobile: "",
  email: "",
  house: "",
  street: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",
  type: "Home",
  isDefault: false,
};
const emptyCard = { holder: "", number: "", expiry: "", cvv: "" };
const paymentMethods = [
  { id: "upi", label: "UPI", icon: "wallet", hint: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: "card", hint: "Credit or debit card" },
  { id: "netbanking", label: "Net banking", icon: "bank", hint: "All major Indian banks" },
  { id: "cod", label: "Cash on delivery", icon: "truck", hint: "Pay when it arrives" },
  { id: "wallet", label: "Wallet", icon: "wallet", hint: "Amazon Pay, Paytm, Mobikwik" },
];
const shippingMethods = [
  { id: "standard", label: "Standard", eta: "3-5 business days", fee: 0 },
  { id: "express", label: "Express", eta: "1-2 business days", fee: 99 },
  { id: "priority", label: "Priority", eta: "Tomorrow by 8 PM", fee: 149 },
];

const digitsOnly = (value) => value.replace(/\D/g, "");
const formatMoney = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const formatCardNumber = (value) => digitsOnly(value).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (value) => digitsOnly(value).slice(0, 4).replace(/(\d{2})(\d{1,2})/, "$1/$2");
const createId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const getInitialAddress = () => {
  try {
    const addresses = getJson("checkout:saved-addresses", []);
    const selectedId = getJson("checkout:selected-address", "");
    return addresses.find((address) => address.id === selectedId) || addresses.find((address) => address.isDefault) || emptyAddress;
  } catch {
    return emptyAddress;
  }
};
const detectCardType = (number) => {
  const digits = digitsOnly(number);
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "RuPay";
  return digits ? "Card" : "";
};

function Field({ label, error, children }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
      {error && <span className="block text-xs font-medium text-rose-600 dark:text-rose-300">{error}</span>}
    </label>
  );
}

function Stepper({ step }) {
  const steps = ["Cart", "Address", "Payment", "Review"];
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {steps.map((label, index) => {
        const active = index <= step;
        return (
          <div key={label} className={`rounded-xl px-2 py-3 text-center text-xs font-bold md:text-sm ${active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-300"}`}>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

function SavedAddressCard({ address, selected, onSelect, onEdit, onDelete, onDefault }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${selected ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-500/10" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-slate-950 dark:text-slate-50">{address.fullName}</p>
            <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-sky-300">{address.type}{address.isDefault ? " • Default" : ""}</p>
          </div>
          {selected && <Icon name="check" className="h-5 w-5 text-blue-600 dark:text-sky-300" />}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {address.house}, {address.street}, {address.city}, {address.state} - {address.pincode}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{address.mobile}</p>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
        <button type="button" onClick={onDefault} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Default</button>
        <button type="button" onClick={onDelete} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10">Delete</button>
      </div>
    </article>
  );
}

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState(getInitialAddress);
  const [savedAddresses, setSavedAddresses] = useLocalStorage("checkout:saved-addresses", []);
  const [selectedAddressId, setSelectedAddressId] = useLocalStorage("checkout:selected-address", "");
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useLocalStorage("checkout:payment-method", "cod");
  const [card, setCard] = useState(emptyCard);
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [shippingId, setShippingId] = useLocalStorage("checkout:shipping-method", "standard");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [autoSave, setAutoSave] = useLocalStorage("checkout:auto-save-address", true);
  const placingOrderRef = useRef(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setCartLoading(true);
        const res = await api.get("/cart");
        setItems(normalizeCart(res.data));
      } catch {
        setItems([]);
      } finally {
        setCartLoading(false);
      }
    };

    loadCart();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product?.price || item.price || 0) * Number(item.quantity || 1), 0),
    [items]
  );
  const selectedShipping = shippingMethods.find((method) => method.id === shippingId) || shippingMethods[0];
  const totals = useMemo(() => {
    const discount = appliedCoupon ? Math.min(subtotal * appliedCoupon.rate, appliedCoupon.max) : 0;
    const taxable = Math.max(subtotal - discount, 0);
    const tax = taxable * 0.18;
    return {
      discount,
      tax,
      total: taxable + tax + selectedShipping.fee,
    };
  }, [appliedCoupon, selectedShipping.fee, subtotal]);
  const { discount, tax, total } = totals;
  const cardType = useMemo(() => detectCardType(card.number), [card.number]);
  const currentStep = items.length === 0 ? 0 : !selectedAddressId ? 1 : !paymentMethod ? 2 : orderSuccess ? 3 : 2;

  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setShippingAddress(address);
  };

  const validateAddress = () => {
    const nextErrors = {};
    if (!shippingAddress.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^[6-9]\d{9}$/.test(shippingAddress.mobile)) nextErrors.mobile = "Enter a valid 10 digit mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) nextErrors.email = "Enter a valid email.";
    if (!shippingAddress.house.trim()) nextErrors.house = "House or flat number is required.";
    if (!shippingAddress.street.trim()) nextErrors.street = "Street address is required.";
    if (!shippingAddress.city.trim()) nextErrors.city = "City is required.";
    if (!shippingAddress.state.trim()) nextErrors.state = "State is required.";
    if (!shippingAddress.district.trim()) nextErrors.district = "District is required.";
    if (!shippingAddress.country.trim()) nextErrors.country = "Country is required.";
    if (!/^\d{6}$/.test(shippingAddress.pincode)) nextErrors.pincode = "Enter a valid 6 digit pincode.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    const nextErrors = {};
    if (paymentMethod === "upi" && !/^[\w.-]+@[\w.-]+$/.test(upiId)) nextErrors.upiId = "Enter a valid UPI ID.";
    if (paymentMethod === "card") {
      if (!card.holder.trim()) nextErrors.cardHolder = "Card holder name is required.";
      if (digitsOnly(card.number).length < 13) nextErrors.cardNumber = "Enter a valid card number.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) nextErrors.expiry = "Use MM/YY format.";
      if (!/^\d{3,4}$/.test(card.cvv)) nextErrors.cvv = "CVV must be 3 or 4 digits.";
    }
    if (paymentMethod === "netbanking" && !selectedBank) nextErrors.bank = "Select a bank.";
    if (paymentMethod === "wallet" && !selectedWallet) nextErrors.wallet = "Select a wallet.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "mobile" || name === "pincode" ? digitsOnly(value) : value;
    setShippingAddress((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const saveAddress = () => {
    if (!validateAddress()) return false;
    const id = shippingAddress.id || createId();
    const addressToSave = { ...shippingAddress, id, isDefault: savedAddresses.length === 0 || shippingAddress.isDefault };
    setSavedAddresses((current) => {
      const exists = current.some((address) => address.id === id);
      const next = exists ? current.map((address) => (address.id === id ? addressToSave : address)) : [...current, addressToSave];
      return addressToSave.isDefault ? next.map((address) => ({ ...address, isDefault: address.id === id })) : next;
    });
    setSelectedAddressId(id);
    setShippingAddress(addressToSave);
    toast.success("Address saved");
    return true;
  };

  const deleteAddress = (id) => {
    setSavedAddresses((current) => current.filter((address) => address.id !== id));
    if (selectedAddressId === id) {
      setSelectedAddressId("");
      setShippingAddress(emptyAddress);
    }
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === "SAVE10") {
      setAppliedCoupon({ code, rate: 0.1, max: 500 });
      toast.success("Coupon applied");
      return;
    }
    setAppliedCoupon(null);
    toast.error("Try SAVE10 for 10% off");
  };

  const clearCartEverywhere = async () => {
    setItems([]);
    dispatch(clearCart());
    storage.remove("cart");
    storage.remove("cartItems");
    storage.remove("cart:cache");
    storage.remove("cart:pending");
    storage.remove("checkout:cart");

    try {
      window.sessionStorage.removeItem("cart");
      window.sessionStorage.removeItem("cartItems");
    } catch {
      // Session storage can be unavailable in locked-down browser modes.
    }

    window.dispatchEvent(new Event("cart:cleared"));

    window.dispatchEvent(new Event("cart:updated"));
  };

  const handlePlaceOrder = async () => {
    if (placingOrderRef.current || placingOrder) return;
    setErrors({});
    if (items.length === 0) return toast.error("Your cart is empty");
    if (!validateAddress()) return toast.error("Please complete the address details");
    if (!validatePayment()) return toast.error("Please fix payment details");
    if (autoSave) saveAddress();

    try {
      placingOrderRef.current = true;
      setPlacingOrder(true);
      const orderResponse = await api.post("/orders", {
        total,
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          ...shippingAddress,
          address: `${shippingAddress.house}, ${shippingAddress.street}${shippingAddress.landmark ? `, ${shippingAddress.landmark}` : ""}`,
          city: shippingAddress.city,
          pincode: shippingAddress.pincode,
          country: shippingAddress.country,
        },
        paymentMethod: paymentMethods.find((method) => method.id === paymentMethod)?.label || "Cash on Delivery",
      });

      await clearCartEverywhere();
      setOrderSuccess(true);
      toast.success("Order placed successfully");
      const placedOrderId = orderResponse.data?._id || orderResponse.data?.id || orderResponse.data?.order?._id || orderResponse.data?.data?._id;
      navigate("/orders", { replace: true, state: { placedOrderId } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Unable to place order");
    } finally {
      placingOrderRef.current = false;
      setPlacingOrder(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">Complete your order</h1>
        </div>
        <p className="w-full rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20 sm:w-auto sm:rounded-full">
          Delivery estimate: {selectedShipping.eta}
        </p>
      </div>

      <Stepper step={currentStep} />

      <div className="grid w-full max-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">1</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Delivery address</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Autocomplete-ready fields with local saved addresses.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={autoSave} onChange={(event) => setAutoSave(event.target.checked)} className="h-4 w-4 accent-blue-600" />
                Auto save
              </label>
            </div>

            {savedAddresses.length > 0 && (
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                {savedAddresses.map((address) => (
                  <SavedAddressCard
                    key={address.id}
                    address={address}
                    selected={selectedAddressId === address.id}
                    onSelect={() => selectAddress(address)}
                    onEdit={() => setShippingAddress(address)}
                    onDelete={() => deleteAddress(address.id)}
                    onDefault={() => setSavedAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === address.id })))}
                  />
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" error={errors.fullName}><input name="fullName" value={shippingAddress.fullName} onChange={handleAddressChange} className={inputClass} placeholder="Recipient name" /></Field>
              <Field label="Mobile number" error={errors.mobile}><input name="mobile" value={shippingAddress.mobile} onChange={handleAddressChange} maxLength="10" className={inputClass} placeholder="10 digit mobile" /></Field>
              <Field label="Email" error={errors.email}><input name="email" value={shippingAddress.email} onChange={handleAddressChange} className={inputClass} placeholder="name@example.com" /></Field>
              <Field label="House / Flat number" error={errors.house}><input name="house" value={shippingAddress.house} onChange={handleAddressChange} className={inputClass} placeholder="Flat 302, Tower B" /></Field>
              <Field label="Street address" error={errors.street}><input name="street" value={shippingAddress.street} onChange={handleAddressChange} className={inputClass} placeholder="Street, area, colony" /></Field>
              <Field label="Landmark"><input name="landmark" value={shippingAddress.landmark} onChange={handleAddressChange} className={inputClass} placeholder="Near..." /></Field>
              <Field label="City" error={errors.city}><input name="city" value={shippingAddress.city} onChange={handleAddressChange} className={inputClass} placeholder="City" /></Field>
              <Field label="District" error={errors.district}><input name="district" value={shippingAddress.district} onChange={handleAddressChange} className={inputClass} placeholder="District" /></Field>
              <Field label="State" error={errors.state}><input name="state" value={shippingAddress.state} onChange={handleAddressChange} className={inputClass} placeholder="State" /></Field>
              <Field label="Country" error={errors.country}><input name="country" value={shippingAddress.country} onChange={handleAddressChange} className={inputClass} placeholder="Country" /></Field>
              <Field label="Pincode" error={errors.pincode}><input name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange} maxLength="6" className={inputClass} placeholder="6 digit pincode" /></Field>
              <Field label="Address type">
                <select name="type" value={shippingAddress.type} onChange={handleAddressChange} className={inputClass}>
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={saveAddress} className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto">Save address</button>
              <button type="button" onClick={() => setShippingAddress(emptyAddress)} className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 sm:w-auto">Add new</button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">2</span>
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Payment</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">Choose a secure payment method.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {paymentMethods.map((method) => (
                <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`rounded-2xl border p-4 text-left shadow-sm hover:-translate-y-0.5 ${paymentMethod === method.id ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"}`}>
                  <Icon name={method.icon} className="h-6 w-6 text-blue-600 dark:text-sky-300" />
                  <p className="mt-3 text-sm font-bold text-slate-950 dark:text-slate-50">{method.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{method.hint}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              {paymentMethod === "upi" && <Field label="UPI ID" error={errors.upiId}><input value={upiId} onChange={(event) => setUpiId(event.target.value)} className={inputClass} placeholder="name@bank" /></Field>}
              {paymentMethod === "card" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Card holder name" error={errors.cardHolder}><input value={card.holder} onChange={(event) => setCard((current) => ({ ...current, holder: event.target.value }))} className={inputClass} placeholder="Name on card" /></Field>
                  <Field label={`Card number ${cardType ? `(${cardType})` : ""}`} error={errors.cardNumber}><input value={card.number} onChange={(event) => setCard((current) => ({ ...current, number: formatCardNumber(event.target.value) }))} className={inputClass} placeholder="1234 5678 9012 3456" /></Field>
                  <Field label="Expiry date" error={errors.expiry}><input value={card.expiry} onChange={(event) => setCard((current) => ({ ...current, expiry: formatExpiry(event.target.value) }))} className={inputClass} placeholder="MM/YY" /></Field>
                  <Field label="CVV" error={errors.cvv}><input value={card.cvv} onChange={(event) => setCard((current) => ({ ...current, cvv: digitsOnly(event.target.value).slice(0, 4) }))} className={inputClass} placeholder="123" /></Field>
                </div>
              )}
              {paymentMethod === "netbanking" && <Field label="Select bank" error={errors.bank}><select value={selectedBank} onChange={(event) => setSelectedBank(event.target.value)} className={inputClass}><option value="">Choose bank</option><option>HDFC Bank</option><option>ICICI Bank</option><option>State Bank of India</option><option>Axis Bank</option></select></Field>}
              {paymentMethod === "wallet" && <Field label="Select wallet" error={errors.wallet}><select value={selectedWallet} onChange={(event) => setSelectedWallet(event.target.value)} className={inputClass}><option value="">Choose wallet</option><option>Amazon Pay</option><option>Paytm</option><option>Mobikwik</option><option>PhonePe Wallet</option></select></Field>}
              {paymentMethod === "cod" && <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"><Icon name="truck" className="h-5 w-5 text-blue-600 dark:text-sky-300" /><p>Cash on delivery is available for this order. Keep exact change ready for a faster handoff.</p></div>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">3</span>
              <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Shipping method</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {shippingMethods.map((method) => (
                <button key={method.id} type="button" onClick={() => setShippingId(method.id)} className={`rounded-2xl border p-4 text-left ${shippingId === method.id ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10 dark:bg-blue-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"}`}>
                  <p className="font-bold text-slate-950 dark:text-slate-50">{method.label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{method.eta}</p>
                  <p className="mt-3 text-sm font-bold text-blue-600 dark:text-sky-300">{method.fee ? formatMoney(method.fee) : "Free"}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-max rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 xl:sticky xl:top-24">
          <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Order summary</h2>
          <div className="mt-5 space-y-3">
            {cartLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-12" />)
            ) : items.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-300">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.product?._id || item.name} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{item.product?.name || item.name} x {item.quantity}</span>
                  <span className="font-semibold text-slate-950 dark:text-slate-50">{formatMoney(Number(item.product?.price || item.price || 0) * Number(item.quantity || 1))}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input value={coupon} onChange={(event) => setCoupon(event.target.value)} className={inputClass} placeholder="Coupon code" />
            <button type="button" onClick={applyCoupon} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:-translate-y-0.5 dark:bg-slate-100 dark:text-slate-950 sm:w-auto">Apply</button>
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
            <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-500 dark:text-slate-300">Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-500 dark:text-slate-300">Discount</span><span className="text-emerald-600">-{formatMoney(discount)}</span></div>
            <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-500 dark:text-slate-300">Shipping</span><span>{selectedShipping.fee ? formatMoney(selectedShipping.fee) : "Free"}</span></div>
            <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-500 dark:text-slate-300">GST 18%</span><span>{formatMoney(tax)}</span></div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 text-lg font-bold dark:border-slate-700"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>

          {orderSuccess && (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
              <div className="mx-auto grid h-12 w-12 animate-bounce place-items-center rounded-full bg-emerald-600 text-white"><Icon name="check" /></div>
              <p className="mt-3 text-sm font-bold">Order placed successfully</p>
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || cartLoading || items.length === 0}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:opacity-60"
          >
            {placingOrder ? "Processing payment..." : "Place order"}
          </button>
        </aside>
      </div>
    </div>
  );
}
