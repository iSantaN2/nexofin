import { Link } from "react-router-dom";
import { ArrowRight, Target, Trash2 } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import SectionPanel from "../ui/SectionPanel";
import { formatCurrency } from "../../utils/formatters";

function BudgetCard({ item, onDelete }) {
  const progressSafe = Math.max(0, Math.min(item.progress, 100));

  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(10,43,110,0.08)] ${item.status.bg} ${item.status.border}`}
      data-testid="budget-card"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-gray-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-white/70">
              <Target size={16} className="text-[#0a2b6e]" />
            </span>
            {item.category}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Gastado: <span className="font-medium">{formatCurrency(item.spent)}</span> de
            <span className="font-medium"> {formatCurrency(item.limit)}</span>
          </p>
          <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.2em] ${item.status.color}`}>
            {item.status.label} - {item.progress.toFixed(1)}%
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.recommendation}</p>
          {item.projectedSpend > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Proyeccion de cierre: {formatCurrency(item.projectedSpend)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to={`/transactions?category=${encodeURIComponent(item.category)}`}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#0a2b6e] shadow-sm transition hover:bg-[#eff8ff]"
          >
            Ver transacciones
            <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
            title="Eliminar meta"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/75">
        <div className={`h-full ${item.status.bar}`} style={{ width: `${progressSafe}%` }} />
      </div>
    </div>
  );
}

export default function BudgetGroup({ title, description, icon: Icon, items, emptyText, onDelete }) {
  return (
    <SectionPanel
      title={
        <span className="inline-flex items-center gap-2">
          <Icon size={18} className="text-[#0a2b6e]" />
          {title} ({items.length})
        </span>
      }
    >
      <p className="mb-4 text-sm text-slate-500">{description}</p>
      {items.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <BudgetCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      )}
    </SectionPanel>
  );
}
