import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
  },
  reducers: {
    addToCart: (state, action) => {
      const item = state.items.find(
        (i) => i.product === action.payload.product
      );

      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
setCart: (state, action) => {
  state.items = Array.isArray(action.payload)
    ? action.payload
    : [];
},
    clearCart: (state) => {
      state.items = [];
    },
  },
});

// 🔥 IMPORTANT EXPORTS
export const { addToCart, setCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;