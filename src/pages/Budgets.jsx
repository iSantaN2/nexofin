import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowRight, PiggyBank, ShieldCheck, Target, Trash2, Wallet } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { useCategories } from "../context/CategoriesContext";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import SectionPanel from "../components/ui/SectionPanel";

const APP_TIME_ZONE = "America/Lima";
const MONTH_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

const getCurrentMonthKey = () => {
  const parts = MONTH_KEY_FORMATTER.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return "";
  return `${year}-${month}`;
};

const toDate = (value) => {
  if (!value) return null;
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
};

const getYearMonthKey = (value) => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;

  const parts = MONTH_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return null;
  return `${year}-${month}`;
};

const getMonthDays = (monthKey) => {
  const [year, month] = (monthKey || "").split("-").map(Number);
  const now = new Date();
  if (!year || !month) {
    return {
      currentDay: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  return {
    currentDay: isCurrentMonth ? now.getDate() : daysInMonth,
    daysInMonth,
  };
};

const isIncome = (transaction) =>
  transaction.type === "Ingreso" || transaction.type === "income";

const getStatus = (progress) => {
  if (progress >= 100) {
    return {
      key: "exceeded",
      label: "Excedido",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      bar: "bg-red-500",
      metricColor: "red",
    };
  }
  if (progress >= 80) {
    return {
      key: "risk",
      label: "En riesgo",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      bar: "bg-amber-500",
      metricColor: "amber",
    };
  }
  return {
    key: "healthy",
    label: "Saludable",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    bar: "bg-emerald-500",
    metricColor: "green",
  };
};

const formatMoney = (value) => `S/ ${(Number(value) || 0).toFixed(2)}`;

const getBudgetRecommendation = (item) => {
  if (item.progress >= 100) {
    return `Ya superaste esta meta por ${formatMoney(Math.abs(item.remaining))}. Revisa los ultimos gastos o ajusta el limite si fue un gasto excepcional.`;
  }

  if (item.progress >= 80) {
    return `Quedan ${formatMoney(Math.max(0, item.remaining))}. Mantén los gastos de esta categoria por debajo de ese monto para cerrar bien el mes.`;
  }

  if (item.projectedExceeded) {
    return `Aunque hoy luce saludable, al ritmo actual podria superar la meta cerca del dia ${item.estimatedExceedDay}.`;
  }

  return `Vas dentro del limite. Puedes usar hasta ${formatMoney(Math.max(0, item.remaining))} sin superar la meta.`;
};

function BudgetCard({ item, onDelete }) {
  const progressSafe = Math.max(0, Math.min(item.progress, 100));

  return (
    <div
      className={`rounded-2xl border p-4 ${item.status.bg} ${item.status.border}`}
      data-testid="budget-card"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            <Target size={16} className="text-[#0a2b6e]" />
            {item.category}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Gastado: <span className="font-medium">{formatMoney(item.spent)}</span> de
            <span className="font-medium"> {formatMoney(item.limit)}</span>
          </p>
          <p className={`text-xs font-semibold mt-1 ${item.status.color}`}>
            {item.status.label} - {item.progress.toFixed(1)}%
          </p>
          <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
          {item.projectedSpend > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              Proyeccion de cierre: {formatMoney(item.projectedSpend)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            to={`/transactions?category=${encodeURIComponent(item.category)}`}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#0a2b6e] shadow-sm hover:bg-[#eff8ff]"
          >
            Ver transacciones
            <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
            title="Eliminar meta"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      </div>

      <div className="h-2 bg-white/75 rounded-full mt-4 overflow-hidden">
        <div className={`h-full ${item.status.bar}`} style={{ width: `${progressSafe}%` }} />
      </div>
    </div>
  );
}

function BudgetGroup({ title, description, icon: Icon, items, emptyText, onDelete }) {
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

export default function Budgets() {
  const {
    budgets,
    upsertBudget,
    deleteBudget,
    loading,
    notificationSettings,
    createNotification,
  } = useContext(AppContext);
  const { transactions } = useContext(TransactionsContext);
  const { categories } = useCategories();
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const monthDays = useMemo(() => getMonthDays(selectedMonth), [selectedMonth]);

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.type === "gasto").map((item) => item.name),
    [categories]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => getYearMonthKey(tx.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const monthTotals = useMemo(() => {
    return monthTransactions.reduce(
      (totals, tx) => {
        const amount = Number(tx.amount) || 0;
        if (isIncome(tx)) totals.income += amount;
        else totals.expenses += amount;
        return totals;
      },
      { income: 0, expenses: 0 }
    );
  }, [monthTransactions]);

  const budgetsForMonth = useMemo(
    () => budgets.filter((item) => item.monthKey === selectedMonth),
    [budgets, selectedMonth]
  );

  const spentByCategory = useMemo(() => {
    const totals = {};

    monthTransactions
      .filter((tx) => !isIncome(tx))
      .forEach((tx) => {
        const category = tx.category || "Sin categoria";
        totals[category] = (totals[category] || 0) + (Number(tx.amount) || 0);
      });

    return totals;
  }, [monthTransactions]);

  const budgetCards = useMemo(() => {
    return budgetsForMonth
      .map((budget) => {
        const spent = spentByCategory[budget.category] || 0;
        const limit = Number(budget.limitAmount) || 0;
        const progress = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = limit - spent;
        const dailyAverage = spent > 0 ? spent / Math.max(1, monthDays.currentDay) : 0;
        const projectedSpend = dailyAverage * monthDays.daysInMonth;
        const projectedExceeded = limit > 0 && projectedSpend > limit;
        const estimatedExceedDay =
          projectedExceeded && dailyAverage > 0
            ? Math.min(monthDays.daysInMonth, Math.ceil(limit / dailyAverage))
            : null;
        const status = getStatus(progress);

        const item = {
          ...budget,
          spent,
          limit,
          remaining,
          progress,
          status,
          dailyAverage,
          projectedSpend,
          projectedExceeded,
          estimatedExceedDay,
        };

        return {
          ...item,
          recommendation: getBudgetRecommendation(item),
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [budgetsForMonth, monthDays, spentByCategory]);

  const budgetSummary = useMemo(() => {
    const totalLimit = budgetCards.reduce((sum, item) => sum + item.limit, 0);
    const totalSpent = budgetCards.reduce((sum, item) => sum + item.spent, 0);
    const projectedTotal = budgetCards.reduce((sum, item) => sum + (item.projectedSpend || 0), 0);
    const exceeded = budgetCards.filter((item) => item.status.key === "exceeded");
    const risk = budgetCards.filter((item) => item.status.key === "risk");
    const healthy = budgetCards.filter((item) => item.status.key === "healthy");
    const progress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    const savings = monthTotals.income - monthTotals.expenses;
    const savingsRate = monthTotals.income > 0 ? (savings / monthTotals.income) * 100 : null;
    const globalStatus =
      exceeded.length > 0 ? "Riesgo alto" : risk.length > 0 ? "Atencion" : "Saludable";

    return {
      totalLimit,
      totalSpent,
      projectedTotal,
      remaining: totalLimit - totalSpent,
      progress,
      exceeded,
      risk,
      healthy,
      savings,
      savingsRate,
      globalStatus,
    };
  }, [budgetCards, monthTotals]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();

    if (!selectedCategory.trim()) {
      toast.error("Selecciona una categoria");
      return;
    }

    const amount = Number(limitAmount);
    if (!amount || amount <= 0) {
      toast.error("Ingresa una meta valida");
      return;
    }

    setSaving(true);
    try {
      await upsertBudget({
        category: selectedCategory,
        monthKey: selectedMonth,
        limitAmount: amount,
      });
      toast.success("Meta guardada correctamente");
      setLimitAmount("");
      setSelectedCategory("");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la meta");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      toast.success("Meta eliminada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la meta");
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    if (selectedMonth !== getCurrentMonthKey()) return;
    if (!budgetCards.length) return;
    if (!notificationSettings?.budget80Enabled && !notificationSettings?.budget100Enabled) return;

    budgetCards.forEach((item) => {
      if (item.progress >= 100 && notificationSettings?.budget100Enabled) {
        createNotification({
          type: "budget_limit",
          title: `Meta excedida: ${item.category}`,
          message: `Gastaste ${formatMoney(item.spent)} de ${formatMoney(item.limit)} en ${item.category}.`,
          recommendation: `Revisa los gastos de ${item.category}. Para volver al limite necesitas reducir ${formatMoney(Math.abs(item.remaining))} o ajustar tu meta mensual.`,
          actionPath: `/transactions?category=${encodeURIComponent(item.category)}`,
          severity: "danger",
          sourceKey: `budget-${selectedMonth}-${item.category}-100`,
          monthKey: selectedMonth,
        });
        return;
      }

      if (item.progress >= 80 && notificationSettings?.budget80Enabled) {
        createNotification({
          type: "budget_warning",
          title: `Meta en riesgo: ${item.category}`,
          message: `${item.category} ya va en ${item.progress.toFixed(1)}% de su meta mensual.`,
          recommendation: `Te quedan ${formatMoney(Math.max(0, item.remaining))} para el resto del mes. Intenta mantener los proximos gastos de ${item.category} por debajo de ese monto.`,
          actionPath: `/transactions?category=${encodeURIComponent(item.category)}`,
          severity: "warning",
          sourceKey: `budget-${selectedMonth}-${item.category}-80`,
          monthKey: selectedMonth,
        });
      }
    });
  }, [
    budgetCards,
    createNotification,
    notificationSettings?.budget100Enabled,
    notificationSettings?.budget80Enabled,
    selectedMonth,
    user?.uid,
  ]);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Metas Pro"
        description="Controla presupuestos, proyecciones y ahorro mensual con una vista ejecutiva."
      />

      <SectionPanel className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-sm text-gray-600">Mes</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthKey())}
              className="mt-1 block border rounded-lg px-3 py-2 sm:min-w-[220px]"
            />
          </div>
          <div className="text-sm text-slate-500">
            Dia {monthDays.currentDay} de {monthDays.daysInMonth}
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="budget-category-select"
            className="border rounded-lg px-3 py-2 md:col-span-2"
            required
          >
            <option value="">Selecciona categoria de gasto</option>
            {expenseCategories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            step="0.01"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Meta mensual (S/)"
            data-testid="budget-amount-input"
            className="border rounded-lg px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={saving}
            data-testid="save-budget-button"
            className="bg-[#0a2b6e] hover:bg-[#081f52] text-white rounded-lg px-3 py-2 font-medium disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar meta"}
          </button>
        </form>
      </SectionPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Presupuesto general"
          value={`${formatMoney(budgetSummary.totalSpent)} / ${formatMoney(budgetSummary.totalLimit)}`}
          helper={`${budgetSummary.progress.toFixed(1)}% usado`}
          color={budgetSummary.progress >= 100 ? "red" : budgetSummary.progress >= 80 ? "amber" : "blue"}
        />
        <MetricCard
          title="Meta de ahorro"
          value={formatMoney(budgetSummary.savings)}
          helper={
            budgetSummary.savingsRate === null
              ? "Sin ingresos registrados"
              : `${budgetSummary.savingsRate.toFixed(1)}% de tus ingresos`
          }
          color={budgetSummary.savings >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Proyeccion mensual"
          value={formatMoney(budgetSummary.projectedTotal)}
          helper="Gasto proyectado segun ritmo actual"
          color={budgetSummary.projectedTotal > budgetSummary.totalLimit ? "amber" : "slate"}
        />
        <MetricCard
          title="Estado global"
          value={budgetSummary.globalStatus}
          helper={`${budgetSummary.exceeded.length} excedidas · ${budgetSummary.risk.length} en riesgo`}
          color={budgetSummary.exceeded.length ? "red" : budgetSummary.risk.length ? "amber" : "green"}
        />
      </div>

      {loading ? (
        <SectionPanel>
          <p className="text-sm text-gray-500">Cargando metas...</p>
        </SectionPanel>
      ) : budgetCards.length === 0 ? (
        <SectionPanel>
          <EmptyState
            title="No tienes metas configuradas para este mes."
            description="Crea una meta por categoria para recibir alertas y entender mejor tus limites."
          />
        </SectionPanel>
      ) : (
        <div className="space-y-6">
          <BudgetGroup
            title="Excedidas"
            description="Prioridad alta: estas categorias ya pasaron el limite definido."
            icon={AlertTriangle}
            items={budgetSummary.exceeded}
            emptyText="No hay metas excedidas. Buen control."
            onDelete={handleDeleteBudget}
          />
          <BudgetGroup
            title="En riesgo"
            description="Categorias que ya superaron el 80% o podrian complicarse."
            icon={Wallet}
            items={budgetSummary.risk}
            emptyText="No hay metas en riesgo."
            onDelete={handleDeleteBudget}
          />
          <BudgetGroup
            title="Saludables"
            description="Categorias dentro de margen, con espacio para cerrar bien el mes."
            icon={ShieldCheck}
            items={budgetSummary.healthy}
            emptyText="Aun no hay metas saludables para este mes."
            onDelete={handleDeleteBudget}
          />
        </div>
      )}

      <SectionPanel title="Lectura rapida del mes">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#dbe8ff] bg-[#f8fbff] p-4">
            <div className="flex items-center gap-2 text-[#0a2b6e]">
              <Target size={18} />
              <p className="font-semibold">Presupuesto general</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Has usado {budgetSummary.progress.toFixed(1)}% del presupuesto configurado.
              {budgetSummary.remaining >= 0
                ? ` Restan ${formatMoney(budgetSummary.remaining)}.`
                : ` Hay exceso de ${formatMoney(Math.abs(budgetSummary.remaining))}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <PiggyBank size={18} />
              <p className="font-semibold">Ahorro mensual</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {budgetSummary.savings >= 0
                ? `Tu balance mensual disponible es ${formatMoney(budgetSummary.savings)}.`
                : `Tus gastos superan tus ingresos por ${formatMoney(Math.abs(budgetSummary.savings))}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              <p className="font-semibold">Siguiente accion</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {budgetSummary.exceeded.length > 0
                ? `Revisa primero ${budgetSummary.exceeded[0].category}, es la meta mas critica.`
                : budgetSummary.risk.length > 0
                ? `Vigila ${budgetSummary.risk[0].category}, esta cerca del limite.`
                : "Mantén el ritmo actual y registra tus movimientos con frecuencia."}
            </p>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
