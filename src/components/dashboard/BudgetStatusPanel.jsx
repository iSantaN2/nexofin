import { Link } from "react-router-dom";
import SectionPanel from "../ui/SectionPanel";
import { formatCurrency } from "../../utils/formatters";

export default function BudgetStatusPanel({ items }) {
  return (
    <SectionPanel className="flex h-full flex-col">
      <div className="mb-4 flex min-h-9 items-center justify-between gap-3">
        <h3 className="font-semibold">Metas del mes</h3>
        <Link
          to="/budgets"
          className="rounded-lg bg-[#e9f2ff] px-3 py-1.5 text-sm text-[#0a2b6e] hover:bg-[#d9ecff]"
        >
          Ir a Metas
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 space-y-3">
          <p className="text-sm text-gray-500">
            No hay metas configuradas para este mes. Puedes crearlas en la seccion Metas.
          </p>
          <Link
            to="/budgets"
            className="inline-flex rounded-lg bg-[#0a2b6e] px-3 py-2 text-sm text-white hover:bg-[#081f52]"
          >
            Crear meta
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-3">
          {items.map((item) => {
            const progressSafe = Math.max(0, Math.min(item.progress, 100));
            return (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{item.category}</p>
                    <p className="text-sm text-gray-600">
                      Gastado: <span className="font-medium">{formatCurrency(item.spent)}</span> de
                      <span className="font-medium"> {formatCurrency(item.limit)}</span>
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${item.status.textColor}`}>
                      {item.status.label} - {item.progress.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-right text-xs text-gray-500">
                    {item.remaining >= 0
                      ? `Restan ${formatCurrency(item.remaining)}`
                      : `Exceso ${formatCurrency(Math.abs(item.remaining))}`}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full ${item.status.barColor}`}
                    style={{ width: `${progressSafe}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionPanel>
  );
}
