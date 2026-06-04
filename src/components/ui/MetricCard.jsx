const colorMap = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red: "bg-red-50 text-red-700 border-red-100",
  blue: "bg-[#e9f2ff] text-[#0a2b6e] border-[#dbe8ff]",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  slate: "bg-slate-50 text-slate-800 border-slate-100",
};

export default function MetricCard({ title, value, helper = "", color = "blue" }) {
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color] || colorMap.blue}`}>
      <p className="text-xs font-medium opacity-90">{title}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs opacity-75">{helper}</p> : null}
    </div>
  );
}
