import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Icon from "../../components/Icon";
import { ADMIN_PLACEHOLDER_IMAGE } from "../../config/env";
import { isCloudinaryConfigured, uploadToCloudinary } from "../../services/cloudinary";
import { safeImageUrl, sanitizeText, validateImageFile } from "../../utils/security";

const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm";
const emptyForm = {
  name: "",
  price: "",
  category: "",
  categoryImage: "",
  profileImage: "",
  bannerImage: "",
  image: "",
  imagePublicId: "",
  description: "",
};

function UploadBox({ label, value, onChange, folder, disabled }) {
  const inputRef = useRef(null);
  const [previewOverride, setPreviewOverride] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lastFile, setLastFile] = useState(null);

  const preview = previewOverride || value || "";

  const uploadFile = async (file) => {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setLastFile(file);
    setError("");
    setProgress(0);
    setPreviewOverride(URL.createObjectURL(file));

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file, { folder, onProgress: setProgress });
      onChange(result.url, result.publicId);
      setPreviewOverride("");
      toast.success(`${label} uploaded`);
    } catch (err) {
      setError(err.message || "Upload failed");
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewOverride("");
    setProgress(0);
    setError("");
    onChange("", "");
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold text-white">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{isCloudinaryConfigured ? "Cloudinary upload enabled" : "Set Cloudinary env or paste a URL below"}</p>
        </div>
        <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Icon name="upload" className="h-4 w-4" />
          {uploading ? "Uploading..." : preview ? "Replace" : "Upload"}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={(event) => uploadFile(event.target.files?.[0])} className="hidden" />

      {preview ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <img src={preview} alt={`${label} preview`} className="h-40 w-full object-cover" />
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 grid h-32 w-full place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-900 text-sm font-semibold text-slate-400 hover:border-blue-500 hover:text-sky-300">
          <span className="inline-flex items-center gap-2"><Icon name="image" /> Choose image</span>
        </button>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">{progress}% uploaded</p>
        </div>
      )}

      {error && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          {lastFile && (
            <button type="button" onClick={() => uploadFile(lastFile)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white">
              <Icon name="retry" className="h-4 w-4" /> Retry
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input value={value || ""} onChange={(event) => onChange(safeImageUrl(event.target.value, "") ? event.target.value : "", "")} className={inputClass} placeholder="Or paste image URL" />
        <button type="button" onClick={removeImage} disabled={!value && !preview} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50">
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : res.data?.products || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(fetchProducts);
  }, []);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const setImageField = (field, value, publicId = "") => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "image" ? { imagePublicId: publicId } : {}),
    }));
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (product) => {
    setForm({ ...emptyForm, ...product });
    setEditId(product._id);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!sanitizeText(form.name)) return toast.error("Product name is required");
    if (!form.price) return toast.error("Product price is required");

    try {
      setLoading(true);
      const payload = {
        ...form,
        name: sanitizeText(form.name),
        category: sanitizeText(form.category),
        description: sanitizeText(form.description),
        price: Number(form.price),
      };

      if (editId) {
        await api.put(`/products/${editId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product added");
      }

      setOpen(false);
      await fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      await fetchProducts();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Catalog</p>
          <h1 className="mt-2 break-words text-2xl font-bold text-white sm:text-3xl">Product Management</h1>
        </div>

        <button onClick={openAdd} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto">
          <Icon name="plus" className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-950 text-slate-400">
              <tr>
                <th className="p-4 text-left">Image</th>
                <th className="text-left">Name</th>
                <th className="text-left">Category</th>
                <th className="text-left">Price</th>
                <th className="text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingProducts ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-slate-400">No products found.</td></tr>
              ) : products.map((product) => (
                <tr key={product._id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4">
                    <img src={safeImageUrl(product.image, ADMIN_PLACEHOLDER_IMAGE)} alt={product.name} className="h-14 w-14 rounded-xl bg-slate-950 object-cover" />
                  </td>
                  <td className="max-w-xs break-words font-semibold text-slate-100">{product.name}</td>
                  <td className="text-slate-300">{product.category || "Uncategorized"}</td>
                  <td className="font-semibold text-sky-400">₹{product.price}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEdit(product)} className="rounded-xl border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-blue-500 hover:text-white">Edit</button>
                      <button onClick={() => handleDelete(product._id)} className="rounded-xl border border-slate-700 px-3 py-2 font-semibold text-slate-300 hover:border-rose-400 hover:text-rose-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {loadingProducts ? (
            <p className="p-4 text-center text-slate-400">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="p-4 text-center text-slate-400">No products found.</p>
          ) : products.map((product) => (
            <article key={product._id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex min-w-0 gap-3">
                <img src={safeImageUrl(product.image, ADMIN_PLACEHOLDER_IMAGE)} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-sm font-bold text-white">{product.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">{product.category || "Uncategorized"}</p>
                  <p className="mt-2 font-bold text-sky-400">₹{product.price}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => openEdit(product)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200">Edit</button>
                <button onClick={() => handleDelete(product._id)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-white">{editId ? "Edit Product" : "Add Product"}</h2>
                <p className="mt-1 text-sm text-slate-400">Upload product, category, profile, and banner images through Cloudinary or paste URLs.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-blue-500">Close</button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} className={inputClass} />
                <input name="price" inputMode="decimal" placeholder="Price" value={form.price} onChange={handleChange} className={inputClass} />
                <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className={inputClass} />
                <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className={`${inputClass} min-h-28 resize-y`} />
              </div>

              <div className="space-y-4">
                <UploadBox label="Product image" folder="ecommerce/products" value={form.image} onChange={(url, publicId) => setImageField("image", url, publicId)} disabled={loading} />
                <UploadBox label="Category image" folder="ecommerce/categories" value={form.categoryImage} onChange={(url) => setImageField("categoryImage", url)} disabled={loading} />
                <UploadBox label="Profile image" folder="ecommerce/profiles" value={form.profileImage} onChange={(url) => setImageField("profileImage", url)} disabled={loading} />
                <UploadBox label="Banner image" folder="ecommerce/banners" value={form.bannerImage} onChange={(url) => setImageField("bannerImage", url)} disabled={loading} />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button onClick={() => setOpen(false)} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-blue-500">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? "Saving..." : "Save product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
