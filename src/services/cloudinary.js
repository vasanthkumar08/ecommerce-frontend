import axios from "axios";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../config/env";
import { validateImageFile } from "../utils/security";

export const isCloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

const uploadErrorMessage = (error) => {
  const cloudinaryMessage = error.response?.data?.error?.message || error.response?.data?.message;

  if (cloudinaryMessage?.toLowerCase().includes("whitelisted")) {
    return "Cloudinary upload preset is not enabled for unsigned uploads. Whitelist the preset in Cloudinary or use a backend signed-upload endpoint.";
  }

  return cloudinaryMessage || error.message || "Cloudinary upload failed.";
};

export async function uploadToCloudinary(file, { folder = "ecommerce", onProgress } = {}) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary env is missing. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  let response;

  try {
    response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        onUploadProgress: (event) => {
          if (!event.total || !onProgress) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      }
    );
  } catch (error) {
    throw new Error(uploadErrorMessage(error));
  }

  return {
    url: response.data.secure_url,
    publicId: response.data.public_id,
    width: response.data.width,
    height: response.data.height,
    bytes: response.data.bytes,
  };
}
