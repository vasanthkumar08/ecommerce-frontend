const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "/api"
);

export const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || "/graphql";

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const PLACEHOLDER_IMAGE = "https://placehold.co/600x600/f8fafc/2563eb?text=Product";
export const ADMIN_PLACEHOLDER_IMAGE = "https://placehold.co/160x160/020617/38bdf8?text=Product";
export const HERO_IMAGE_URL =
  import.meta.env.VITE_HERO_IMAGE_URL ||
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";
