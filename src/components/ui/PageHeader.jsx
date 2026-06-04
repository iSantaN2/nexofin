export default function PageHeader({ title, description, action = null }) {
  return (
    <div className="nexo-surface relative overflow-hidden rounded-3xl border border-[#dbe8ff] px-5 py-4 shadow-sm sm:px-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f67ff] via-[#19b9c7] to-[#11c69a]" />
      <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[#11c69a]/15 blur-2xl" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="nexo-chip mb-2">NexoFin Pro</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#061a3d] sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
