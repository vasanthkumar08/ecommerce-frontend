import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function Dashboard() {
  const cards = [
    { to: "/cart", title: "Cart", copy: "Review items and checkout.", icon: "cart" },
    { to: "/orders", title: "Orders", copy: "Track purchases and delivery.", icon: "orders" },
    { to: "/profile", title: "Profile", copy: "Manage account details.", icon: "user" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-400">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">Your shopping hub</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Quick access to your cart, orders, and account settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-blue-600 dark:bg-slate-900 dark:text-sky-400">
              <Icon name={card.icon} />
            </div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{card.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
