export default function PageHeader({ title, description, action = null }) {
  return (
    <div className="nexo-surface rounded-3xl border border-[#dbe8ff] px-5 py-4 shadow-sm sm:px-6">
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
