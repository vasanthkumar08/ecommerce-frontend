import { createSlice } from "@reduxjs/toolkit";
import { getAuthToken, getJson, setJson, storage } from "../../utils/storage";

const initialState = {
  user: getJson("user", null),
  token: getAuthToken() || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {

    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      setJson("user", action.payload.user);
      storage.set("token", action.payload.token);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;

      storage.clearAuth();
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
