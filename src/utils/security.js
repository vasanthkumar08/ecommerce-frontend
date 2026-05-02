const allowedImageProtocols = new Set(["https:", "http:", "data:", "blob:"]);
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxImageBytes = 5 * 1024 * 1024;

export const sanitizeText = (value) => String(value || "").trim();

export const isSafeImageUrl = (value) => {
  if (!value) return false;
  if (value.startsWith("/")) return true;

  try {
    const url = new URL(value, window.location.origin);
    return allowedImageProtocols.has(url.protocol);
  } catch {
    return false;
  }
};

export const safeImageUrl = (value, fallback) => (isSafeImageUrl(value) ? value : fallback);

export const validateImageFile = (file) => {
  if (!file) return "Choose an image first.";
  if (!allowedImageTypes.includes(file.type)) return "Only JPG, PNG, WEBP, or GIF images are allowed.";
  if (file.size > maxImageBytes) return "Image must be 5 MB or smaller.";
  return "";
};
