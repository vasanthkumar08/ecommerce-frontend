import { getAuthToken, setJson, storage } from "./storage";

const AUTH_RETURN_TO_KEY = "auth:return-to";
const AUTH_PENDING_ACTION_KEY = "auth:pending-action";

export const getCurrentPath = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const getAuthReturnTo = (fallback = "/") => {
  const value = storage.get(AUTH_RETURN_TO_KEY, "");
  return value || fallback;
};

export const clearAuthRedirect = () => {
  storage.remove(AUTH_RETURN_TO_KEY);
  storage.remove(AUTH_PENDING_ACTION_KEY);
};

export const requireAuthForAction = ({
  navigate,
  toast,
  message = "Please login to continue",
  returnTo = getCurrentPath(),
  pendingAction = null,
} = {}) => {
  if (getAuthToken()) return true;

  storage.set(AUTH_RETURN_TO_KEY, returnTo || "/");
  if (pendingAction) setJson(AUTH_PENDING_ACTION_KEY, pendingAction);
  toast?.error(message);
  navigate?.("/login", { state: { returnTo } });
  return false;
};
