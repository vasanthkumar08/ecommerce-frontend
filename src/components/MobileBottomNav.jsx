import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const items = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/wishlist", label: "Wishlist", icon: "heart" },
  { to: "/cart", label: "Cart", icon: "cart" },
  { to: "/orders", label: "Orders", icon: "orders" },
  { to: "/profile", label: "Profile", icon: "user" },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-2 bottom-2 z-50 grid max-w-[calc(100vw-1rem)] grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:inset-x-3 sm:bottom-3 sm:p-2 md:hidden dark:border-slate-700 dark:bg-slate-900/95">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-medium min-[375px]:text-[11px] sm:px-2 sm:text-xs ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`
          }
        >
          <Icon name={item.icon} className="h-5 w-5" />
          <span className="max-w-full truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
