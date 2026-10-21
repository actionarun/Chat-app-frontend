export default function Avatar({ name, online, size = "w-10 h-10" }) {
  return (
    <div className={`relative ${size} shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 grid place-items-center text-sm font-semibold`}>
      {name.slice(0, 2).toUpperCase()}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${online ? "bg-green-500" : "bg-slate-400"}`} />
      )}
    </div>
  );
}
