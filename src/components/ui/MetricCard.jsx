const colorMap = {
  green: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-800",
    accent: "bg-emerald-500",
  },
  red: {
    card: "border-red-100 bg-gradient-to-br from-red-50 to-white text-red-800",
    accent: "bg-red-500",
  },
  blue: {
    card: "border-[#dbe8ff] bg-gradient-to-br from-[#eff8ff] to-white text-[#0a2b6e]",
    accent: "bg-[#1f67ff]",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-800",
    accent: "bg-amber-500",
  },
  slate: {
    card: "border-slate-100 bg-gradient-to-br from-slate-50 to-white text-slate-800",
    accent: "bg-slate-400",
  },
};

export default function MetricCard({ title, value, helper = "", color = "blue", icon = null }) {
  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${style.card}`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-tight">{value}</p>
        </div>
        {icon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/75 shadow-sm">
            {icon}
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-1 text-xs opacity-75">{helper}</p> : null}
    </div>
  );
}
