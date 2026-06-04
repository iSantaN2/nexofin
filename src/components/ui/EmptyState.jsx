export default function EmptyState({ title, description = "", action = null }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#bcd2ff] bg-gradient-to-br from-[#f8fbff] to-white px-5 py-10 text-center">
      <div className="mx-auto mb-3 h-2 w-20 rounded-full bg-gradient-to-r from-[#1f67ff] to-[#11c69a]" />
      <p className="font-semibold text-[#061a3d]">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
