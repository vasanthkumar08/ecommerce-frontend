export default function Input(props) {
  return (
    <input
      {...props}
      className={`focus-blue mb-3 min-h-[var(--control-height)] w-full min-w-0 rounded-[var(--radius-control)] border border-slate-200 bg-white px-[var(--control-padding-x)] py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${props.className || ""}`}
    />
  );
}
