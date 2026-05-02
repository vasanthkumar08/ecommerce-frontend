import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" />;

  if (user.role !== "admin") {
    return (
      <div className="p-6 text-red-600 text-xl">
        🚫 Admin Only Access
      </div>
    );
  }

  return children;
}