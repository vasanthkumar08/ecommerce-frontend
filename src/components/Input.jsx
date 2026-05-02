export default function Input(props) {
  return (
    <input
      {...props}
      className={`focus-blue mb-3 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm ${props.className || ""}`}
    />
  );
}
