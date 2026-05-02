import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import Icon from "../../components/Icon";

export default function AdminLayout() {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navClass = (path) =>
    `flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold md:justify-start md:gap-3 md:px-3 md:text-sm ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-900 p-4 md:w-64 md:border-b-0 md:border-r lg:w-72">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 font-bold text-white">A</div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold">Admin Panel</h1>
                <p className="text-sm text-slate-400">{user?.name || "Administrator"}</p>
              </div>
            </div>
          </div>

          <nav className="grid grid-cols-3 gap-2 md:block md:space-y-2">
            <Link className={navClass("/admin")} to="/admin">
              <Icon name="dashboard" className="h-5 w-5 shrink-0" /> <span className="truncate">Dashboard</span>
            </Link>
            <Link className={navClass("/admin/products")} to="/admin/products">
              <Icon name="products" className="h-5 w-5 shrink-0" /> <span className="truncate">Products</span>
            </Link>
            <Link className={navClass("/admin/orders")} to="/admin/orders">
              <Icon name="orders" className="h-5 w-5 shrink-0" /> <span className="truncate">Orders</span>
            </Link>
          </nav>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm">
            <p className="text-slate-400">Email</p>
            <p className="mt-1 truncate font-semibold">{user?.email}</p>
            <p className="mt-4 text-slate-400">Role</p>
            <p className="mt-1 font-semibold capitalize">{user?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-blue-500 hover:text-white"
          >
            <Icon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
