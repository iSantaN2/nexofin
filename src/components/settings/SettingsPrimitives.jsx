export function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
  tone = "default",
  className = "",
}) {
  const isDanger = tone === "danger";

  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-sm ${
        isDanger ? "border-red-200 bg-gradient-to-br from-white to-red-50/80" : "border-[#dbe8ff] bg-white"
      } ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon ? (
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDanger
                ? "bg-red-100 text-red-600"
                : "bg-gradient-to-br from-[#e9f2ff] to-[#e9fff8] text-[#0a2b6e]"
            }`}
          >
            <Icon size={20} />
          </span>
        ) : null}
        <div>
          <h3 className={`font-bold ${isDanger ? "text-red-700" : "text-[#06142e]"}`}>
            {title}
          </h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SettingsEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#cfe0fb] bg-[#f8fbff] p-6 text-center">
      <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0a2b6e] shadow-sm">
        <Icon size={20} />
      </span>
      <p className="font-bold text-[#06142e]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
