export default function EmptyState({ title, description = "", action = null }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfe0ff] bg-[#f8fbff] px-4 py-8 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
