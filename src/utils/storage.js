const isBrowser = typeof window !== "undefined";

export const storage = {
  get(key, fallback = null) {
    if (!isBrowser) return fallback;
    try {
      const value = window.localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in private browsing or locked-down embeds.
    }
  },

  remove(key) {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  },

  clearAuth() {
    this.remove("token");
    this.remove("user");
  },
};

export const getJson = (key, fallback = null) => {
  try {
    const value = storage.get(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    storage.remove(key);
    return fallback;
  }
};

export const setJson = (key, value) => {
  storage.set(key, JSON.stringify(value));
};

export const getAuthToken = () => storage.get("token", "");
