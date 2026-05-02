import { useNavigate, useSearchParams } from "react-router-dom";

const categories = ["All", "Electronics", "Fashion", "Home", "Beauty"];

export default function CategoryBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = searchParams.get("category") || "All";

  const selectCategory = (category) => {
    const next = new URLSearchParams(searchParams);

    if (category === "All") {
      next.delete("category");
    } else {
      next.set("category", category);
    }

    if (window.location.pathname === "/") {
      setSearchParams(next);
    } else {
      navigate({ pathname: "/", search: next.toString() ? `?${next.toString()}` : "" });
    }
  };

  return (
    <section className="max-w-full border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="scrollbar-hide app-container overflow-x-auto overscroll-x-contain scroll-smooth py-3">
        <div className="flex min-w-max gap-2 whitespace-nowrap pr-3">
          {categories.map((category) => {
            const selected = selectedCategory.toLowerCase() === category.toLowerCase();

            return (
              <button
                key={category}
                onClick={() => selectCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
