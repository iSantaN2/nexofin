const colorMap = {
  green: {
    card: "border-emerald-100 bg-white",
    accent: "bg-emerald-500",
    value: "text-emerald-700",
  },
  red: {
    card: "border-red-100 bg-white",
    accent: "bg-red-500",
    value: "text-red-700",
  },
  blue: {
    card: "border-[#dbe8ff] bg-white",
    accent: "bg-[#1f67ff]",
    value: "text-[#0a2b6e]",
  },
  amber: {
    card: "border-amber-100 bg-white",
    accent: "bg-amber-500",
    value: "text-amber-700",
  },
  slate: {
    card: "border-slate-200 bg-white",
    accent: "bg-slate-400",
    value: "text-slate-700",
  },
};

export default function MetricCard({ title, value, helper = "", color = "blue", icon = null }) {
  const style = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(10,43,110,0.1)] ${style.card}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white via-white to-white/0" />
      <div className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className={`mt-1 text-2xl font-bold leading-tight ${style.value}`}>{value}</p>
        </div>
        {icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8fbff] text-slate-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {icon}
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
