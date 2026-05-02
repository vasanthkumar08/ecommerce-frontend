import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config/env";
import { getAuthToken } from "../../utils/storage";

export const apiSlice = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAuthToken();

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Products", "Cart"],

  endpoints: (builder) => ({

    // PRODUCTS
    getProducts: builder.query({
      query: () => "/products",
      providesTags: ["Products"],
    }),

    // CART (LIVE DATA)
    getCart: builder.query({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),

    // ADD TO CART (AUTO REFRESH CART)
    addToCart: builder.mutation({
      query: (data) => ({
        url: "/cart/add",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Cart"],
    }),

  }),
});

export const {
  useGetProductsQuery,
  useGetCartQuery,
  useAddToCartMutation,
} = apiSlice;
