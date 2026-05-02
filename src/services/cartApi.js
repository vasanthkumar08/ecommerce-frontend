import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { getAuthToken } from "../utils/storage";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

// GET CART
export const getCartApi = () =>
  axios.get(`${API_BASE_URL}/cart`, authHeader());

// ADD TO CART
export const addToCartApi = (data) =>
  axios.post(`${API_BASE_URL}/cart/add`, data, authHeader());

// UPDATE CART
export const updateCartApi = (data) =>
  axios.put(`${API_BASE_URL}/cart/update`, data, authHeader());

// REMOVE ITEM
export const removeCartApi = (id) =>
  axios.delete(`${API_BASE_URL}/cart/remove/${id}`, authHeader());

// 🆕 CLEAR CART
export const clearCartApi = () =>
  axios.delete(`${API_BASE_URL}/cart/clear`, authHeader());
