import { AlertTriangle, Lightbulb, Target, TrendingUp } from "lucide-react";
import SectionPanel from "../ui/SectionPanel";
import { formatCurrency } from "../../utils/formatters";

export default function DashboardInsights({
  monthlyInsight,
  topExpenseCategory,
  criticalBudget,
  financialRecommendation,
  savingsRate,
  mainUnusualExpense,
  criticalBudgetProjection,
}) {
  const insightCards = [
    {
      title: "Insight del mes",
      icon: Lightbulb,
      iconClassName: "text-[#0a2b6e]",
      wrapperClassName: "border-[#dbe8ff] bg-[#f8fbff]",
      content: <p className="mt-3 text-sm leading-6 text-slate-600">{monthlyInsight}</p>,
    },
    {
      title: "Mayor gasto",
      icon: TrendingUp,
      iconClassName: "text-red-700",
      wrapperClassName: "border-red-100 bg-red-50",
      content: topExpenseCategory ? (
        <>
          <p className="mt-3 text-2xl font-bold text-red-700">
            {formatCurrency(topExpenseCategory.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-600">{topExpenseCategory.category}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Sin gastos registrados este mes.</p>
      ),
    },
    {
      title: "Meta critica",
      icon: Target,
      iconClassName: "text-amber-700",
      wrapperClassName: "border-amber-100 bg-amber-50",
      content: criticalBudget ? (
        <>
          <p className={`mt-3 text-2xl font-bold ${criticalBudget.status.textColor}`}>
            {criticalBudget.progress.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-slate-600">{criticalBudget.category}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Aun no hay metas para evaluar.</p>
      ),
    },
    {
      title: "Recomendacion",
      icon: AlertTriangle,
      iconClassName: "text-emerald-700",
      wrapperClassName: "border-emerald-100 bg-emerald-50",
      content: (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-600">{financialRecommendation}</p>
          {savingsRate !== null ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Ahorro estimado: {savingsRate.toFixed(1)}%
            </p>
          ) : null}
        </>
      ),
    },
    {
      title: "Gasto inusual",
      icon: AlertTriangle,
      iconClassName: "text-orange-700",
      wrapperClassName: "border-orange-100 bg-orange-50",
      content: mainUnusualExpense ? (
        <>
          <p className="mt-3 text-sm font-semibold text-slate-800">{mainUnusualExpense.category}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Subio {formatCurrency(mainUnusualExpense.increaseAmount)}
            {mainUnusualExpense.increasePercent !== null
              ? ` (${mainUnusualExpense.increasePercent.toFixed(1)}%)`
              : " respecto al mes anterior"}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No se detectan aumentos fuertes vs el mes anterior.
        </p>
      ),
    },
    {
      title: "Proyeccion de meta",
      icon: TrendingUp,
      iconClassName: "text-sky-700",
      wrapperClassName: "border-sky-100 bg-sky-50",
      content: criticalBudgetProjection ? (
        <>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {criticalBudgetProjection.category}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Podrias cerrar en {formatCurrency(criticalBudgetProjection.projectedSpend)}
            {criticalBudgetProjection.estimatedExceedDay
              ? ` y superar la meta cerca del dia ${criticalBudgetProjection.estimatedExceedDay}.`
              : "."}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Tus metas no proyectan exceso con el ritmo actual.
        </p>
      ),
    },
  ];

  return (
    <SectionPanel title="Inteligencia financiera">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {insightCards.map(({ title, icon: Icon, iconClassName, wrapperClassName, content }) => (
          <div
            key={title}
            className={`rounded-[1.5rem] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(10,43,110,0.08)] ${wrapperClassName}`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-white/60">
                <Icon className={`h-4 w-4 ${iconClassName}`} />
              </span>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
            </div>
            {content}
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}
