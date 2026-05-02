import { configureStore } from "@reduxjs/toolkit";

// 🔥 OLD SLICES
import cartReducer from "../features/cart/cartSlice";
import productReducer from "../features/products/productSlice";
import authReducer from "../features/auth/authSlice";

// 🔥 RTK QUERY APIs
import { productApi } from "../services/productApi";
import { apiSlice } from "../features/api/apiSlice";

export const store = configureStore({
  reducer: {
    // 🧠 NORMAL REDUCERS
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,

    // ⚡ RTK QUERY APIs
    [productApi.reducerPath]: productApi.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      productApi.middleware,
      apiSlice.middleware
    ),
});