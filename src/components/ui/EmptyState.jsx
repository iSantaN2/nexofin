import { Sparkles } from "lucide-react";

export default function EmptyState({ title, description = "", action = null, icon = null }) {
  const Icon = icon || Sparkles;

  return (
    <div className="rounded-2xl border border-dashed border-[#bcd2ff] bg-gradient-to-br from-[#f8fbff] via-white to-[#ebfbf7] px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f67ff] to-[#11c69a] text-white shadow-[0_12px_30px_rgba(31,103,255,0.2)]">
        <Icon size={22} />
      </div>
      <p className="font-semibold text-[#061a3d]">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
