import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  filtered: [],
  searchTerm: "",
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.filtered = action.payload;
    },

    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;

      state.filtered = state.products.filter((p) =>
        (p.name || p.title || "")
          .toLowerCase()
          .includes(action.payload.toLowerCase())
      );
    },
  },
});

export const { setProducts, setSearchTerm } = productSlice.actions;
export default productSlice.reducer;
