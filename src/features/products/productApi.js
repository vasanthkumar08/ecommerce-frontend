import api from "../../services/api";

export const fetchProducts = async () => {
  const response = await api.get("/products");
  return Array.isArray(response.data) ? response.data : response.data?.products || [];
};
