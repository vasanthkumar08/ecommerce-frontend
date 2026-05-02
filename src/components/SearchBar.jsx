import { useMemo, useState } from "react";
import Icon from "./Icon";

export default function SearchBar({ value = "", onSearch, suggestions = [] }) {
  const [focused, setFocused] = useState(false);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((item) => value && item.name?.toLowerCase().includes(value.toLowerCase())).slice(0, 5),
    [suggestions, value]
  );

  return (
    <div className="relative w-full min-w-0">
      <label className="relative block w-full">
        <span className="sr-only">Search products</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          placeholder="Search products..."
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onChange={(e) => onSearch?.(e.target.value)}
          className="focus-blue w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </label>

      {focused && visibleSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {visibleSuggestions.map((product) => (
            <button
              key={product._id}
              onMouseDown={() => onSearch?.(product.name)}
              className="flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              <span className="truncate font-medium text-slate-800 dark:text-slate-100">{product.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
