export default function LoadingState({
  title = "Preparando NexoFin",
  description = "Estamos cargando tu información financiera.",
  fullScreen = false,
}) {
  const content = (
    <div
      className="relative overflow-hidden rounded-3xl border border-[#dbe8ff] bg-white/90 px-8 py-10 text-center shadow-[0_22px_65px_rgba(10,43,110,0.12)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f67ff] via-[#19b9c7] to-[#11c69a]" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff8ff]" aria-hidden="true">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#1f67ff] border-t-transparent" />
      </div>
      <p className="mt-5 text-lg font-semibold text-[#061a3d]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      <div className="mx-auto mt-6 grid max-w-xs gap-2">
        <span className="h-2 animate-pulse rounded-full bg-[#dbe8ff]" />
        <span className="mx-auto h-2 w-4/5 animate-pulse rounded-full bg-[#ebfbf7]" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#f8fbff] p-4 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-6">{content}</div>;
}
