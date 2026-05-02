import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { getAuthToken, storage } from "../utils/storage";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use(
  (req) => {
    const token = getAuthToken();

    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
  },
  (error) => Promise.reject(error)
);

// 🚨 Global error handler
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};
    const method = String(config.method || "get").toLowerCase();
    const canRetry = method === "get" && !config.__retried && !error.response;

    if (canRetry) {
      config.__retried = true;
      return api(config);
    }

    if (error.response?.status === 401) {
      storage.clearAuth();

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
