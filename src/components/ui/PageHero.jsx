export default function PageHero({
  eyebrow = "Vista ejecutiva",
  title,
  description,
  stats = [],
  actions = null,
}) {
  const toneClasses = {
    default: "border-[#dbe8ff] bg-white",
    success: "border-emerald-100 bg-emerald-50/80",
    danger: "border-red-100 bg-red-50/80",
    warning: "border-amber-100 bg-amber-50/80",
  };

  const toneValueClasses = {
    default: "text-[#0a2b6e]",
    success: "text-emerald-700",
    danger: "text-red-700",
    warning: "text-amber-700",
  };

  return (
    <section className="nexo-surface relative overflow-hidden rounded-3xl border border-[#dbe8ff] bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f67ff] via-[#19b9c7] to-[#11c69a]" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[#11c69a]/15 blur-2xl" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <span className="nexo-chip mb-2">{eyebrow}</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#061a3d] sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="relative z-10 flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>

      {stats.length > 0 ? (
        <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border px-4 py-3 shadow-sm ${
                toneClasses[stat.tone || "default"] || toneClasses.default
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${toneValueClasses[stat.tone || "default"] || toneValueClasses.default}`}>
                {stat.value}
              </p>
              {stat.helper ? <p className="mt-1 text-xs text-slate-500">{stat.helper}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
