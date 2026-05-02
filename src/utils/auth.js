export const isAdmin = (user) => {
  return user?.role === "admin";
};