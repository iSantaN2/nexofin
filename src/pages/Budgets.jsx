import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, PiggyBank, ShieldCheck, Target, Wallet } from "lucide-react";
import { TransactionsContext } from "../context/TransactionsContext";
import { useCategories } from "../context/CategoriesContext";
import { useAuth } from "../context/AuthContext";
import { useBudgets } from "../hooks/useBudgets";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import MonthSelector from "../components/ui/MonthSelector";
import PageHero from "../components/ui/PageHero";
import SectionPanel from "../components/ui/SectionPanel";
import BudgetGroup from "../components/budgets/BudgetGroup";
import {
  buildBudgetCards,
  getBudgetMonthDays,
  getBudgetMonthTotals,
  getBudgetSpentByCategory,
  getBudgetSummary,
} from "../services/budgetAnalytics";
import { buildBudgetAlertNotification } from "../utils/budgetNotifications";
import Button from "../components/ui/Button";
import { formatCurrency, getCurrentMonthKey, getMonthKey } from "../utils/formatters";
import { logError } from "../services/logger";

export default function Budgets() {
  const {
    budgets,
    budgetsError,
    upsertBudget,
    deleteBudget,
    loading,
    notificationSettings,
    createNotification,
  } = useBudgets();
  const { transactions } = useContext(TransactionsContext);
  const { categories } = useCategories();
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const monthDays = useMemo(() => getBudgetMonthDays(selectedMonth), [selectedMonth]);

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.type === "gasto").map((item) => item.name),
    [categories]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => getMonthKey(tx.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const monthTotals = useMemo(() => getBudgetMonthTotals(monthTransactions), [monthTransactions]);

  const budgetsForMonth = useMemo(
    () => budgets.filter((item) => item.monthKey === selectedMonth),
    [budgets, selectedMonth]
  );

  const spentByCategory = useMemo(
    () => getBudgetSpentByCategory(monthTransactions),
    [monthTransactions]
  );

  const budgetCards = useMemo(() => {
    return buildBudgetCards({
      budgets: budgetsForMonth,
      spentByCategory,
      monthDays,
    });
  }, [budgetsForMonth, monthDays, spentByCategory]);

  const budgetSummary = useMemo(() => {
    return getBudgetSummary({ budgetCards, monthTotals });
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
      logError("No se pudo guardar la meta", error, {
        source: "budgets.save",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      toast.success("Meta eliminada");
    } catch (error) {
      logError("No se pudo eliminar la meta", error, {
        source: "budgets.delete",
      });
      toast.error("No se pudo eliminar la meta");
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    if (selectedMonth !== getCurrentMonthKey()) return;
    if (!budgetCards.length) return;

    budgetCards.forEach((item) => {
      const budgetNotification = buildBudgetAlertNotification({
        category: item.category,
        spent: item.spent,
        limit: item.limit,
        monthKey: selectedMonth,
        notificationSettings,
      });

      if (budgetNotification) {
        createNotification(budgetNotification);
      }

      if (item.progress >= 100) {
        return;
      }

      if (item.projectedExceeded) {
        createNotification({
          type: "budget_projection",
          title: `Proyeccion de meta: ${item.category}`,
          message: item.estimatedExceedDay
            ? `Con tu ritmo actual podrias superar la meta cerca del dia ${item.estimatedExceedDay}.`
            : `Con tu ritmo actual podrias cerrar en ${formatCurrency(item.projectedSpend)}.`,
          recommendation: `Reduce el ritmo de gasto en ${item.category} o ajusta la meta si este mes tiene gastos excepcionales.`,
          actionPath: `/transactions?category=${encodeURIComponent(item.category)}`,
          severity: "warning",
          sourceKey: `projection-${selectedMonth}-${item.category}`,
          monthKey: selectedMonth,
        });
      }
    });
  }, [
    budgetCards,
    createNotification,
    notificationSettings,
    notificationSettings?.budget100Enabled,
    notificationSettings?.budget80Enabled,
    selectedMonth,
    user?.uid,
  ]);

  return (
    <div className="space-y-6 pb-20">
      <PageHero
        eyebrow="Planeacion"
        title="Metas Pro"
        description="Controla presupuestos, proyecciones y ahorro mensual con una lectura ejecutiva y foco en desbordes."
        stats={[
          {
            label: "Usado",
            value: `${budgetSummary.progress.toFixed(1)}%`,
            tone:
              budgetSummary.progress >= 100
                ? "danger"
                : budgetSummary.progress >= 80
                ? "warning"
                : "default",
          },
          {
            label: "Ahorro",
            value: formatCurrency(budgetSummary.savings),
            tone: budgetSummary.savings >= 0 ? "success" : "danger",
          },
          {
            label: "Proyeccion",
            value: formatCurrency(budgetSummary.projectedTotal),
            tone: budgetSummary.projectedTotal > budgetSummary.totalLimit ? "warning" : "default",
          },
          {
            label: "Excedidas",
            value: `${budgetSummary.exceeded.length}`,
            tone: budgetSummary.exceeded.length ? "danger" : "success",
          },
        ]}
      />

      <SectionPanel className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <MonthSelector
            label="Mes"
            value={selectedMonth}
            onChange={(nextMonth) => setSelectedMonth(nextMonth || getCurrentMonthKey())}
          />
          <div className="rounded-2xl border border-[#dbe8ff] bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
            Dia {monthDays.currentDay} de {monthDays.daysInMonth}
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="budget-category-select"
            className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 shadow-sm md:col-span-2"
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
            className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 shadow-sm"
            required
          />

          <Button
            type="submit"
            disabled={saving}
            data-testid="save-budget-button"
            variant="brand"
          >
            {saving ? "Guardando..." : "Guardar meta"}
          </Button>
        </form>
      </SectionPanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Presupuesto general"
          value={`${formatCurrency(budgetSummary.totalSpent)} / ${formatCurrency(budgetSummary.totalLimit)}`}
          helper={`${budgetSummary.progress.toFixed(1)}% usado`}
          color={budgetSummary.progress >= 100 ? "red" : budgetSummary.progress >= 80 ? "amber" : "blue"}
        />
        <MetricCard
          title="Meta de ahorro"
          value={formatCurrency(budgetSummary.savings)}
          helper={
            budgetSummary.savingsRate === null
              ? "Sin ingresos registrados"
              : `${budgetSummary.savingsRate.toFixed(1)}% de tus ingresos`
          }
          color={budgetSummary.savings >= 0 ? "green" : "red"}
        />
        <MetricCard
          title="Proyeccion mensual"
          value={formatCurrency(budgetSummary.projectedTotal)}
          helper="Gasto proyectado segun ritmo actual"
          color={budgetSummary.projectedTotal > budgetSummary.totalLimit ? "amber" : "slate"}
        />
        <MetricCard
          title="Estado global"
          value={budgetSummary.globalStatus}
          helper={`${budgetSummary.exceeded.length} excedidas - ${budgetSummary.risk.length} en riesgo`}
          color={budgetSummary.exceeded.length ? "red" : budgetSummary.risk.length ? "amber" : "green"}
        />
      </div>

      {loading ? (
        <SectionPanel>
          <p className="text-sm text-gray-500">Cargando metas...</p>
        </SectionPanel>
      ) : budgetsError ? (
        <SectionPanel>
          <p className="text-sm font-semibold text-red-600">{budgetsError}</p>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#dbe8ff] bg-[#f8fbff] p-4">
            <div className="flex items-center gap-2 text-[#0a2b6e]">
              <Target size={18} />
              <p className="font-semibold">Presupuesto general</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Has usado {budgetSummary.progress.toFixed(1)}% del presupuesto configurado.
              {budgetSummary.remaining >= 0
                ? ` Restan ${formatCurrency(budgetSummary.remaining)}.`
                : ` Hay exceso de ${formatCurrency(Math.abs(budgetSummary.remaining))}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <PiggyBank size={18} />
              <p className="font-semibold">Ahorro mensual</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {budgetSummary.savings >= 0
                ? `Tu balance mensual disponible es ${formatCurrency(budgetSummary.savings)}.`
                : `Tus gastos superan tus ingresos por ${formatCurrency(Math.abs(budgetSummary.savings))}.`}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              <p className="font-semibold">Siguiente accion</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {budgetSummary.exceeded.length > 0
                ? `Revisa primero ${budgetSummary.exceeded[0].category}, es la meta mas critica.`
                : budgetSummary.risk.length > 0
                ? `Vigila ${budgetSummary.risk[0].category}, esta cerca del limite.`
                : "Manten el ritmo actual y registra tus movimientos con frecuencia."}
            </p>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
}
