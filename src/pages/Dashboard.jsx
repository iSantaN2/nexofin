import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { useAuth } from "../context/AuthContext";
import AddTransactionModal from "../components/AddTransactionModal";
import BudgetStatusPanel from "../components/dashboard/BudgetStatusPanel";
import CategoryDistributionPanel from "../components/dashboard/CategoryDistributionPanel";
import DashboardInsights from "../components/dashboard/DashboardInsights";
import RecentTransactionsPanel from "../components/dashboard/RecentTransactionsPanel";
import Button from "../components/ui/Button";
import LoadingState from "../components/ui/LoadingState";
import MonthSelector from "../components/ui/MonthSelector";
import PageHero from "../components/ui/PageHero";
import SectionPanel from "../components/ui/SectionPanel";
import toast from "react-hot-toast";
import { buildBudgetAlertNotification, getBudgetAlertMilestone } from "../utils/budgetNotifications";
import {
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthKey,
  getDayKey,
  getPreviousMonthKey,
} from "../utils/formatters";
import { buildDashboardModel } from "../services/dashboardAnalytics";
import { logError } from "../services/logger";

const ITEMS_PER_PAGE = 10;
const INCOME_COLORS = ["#4ade80", "#22c55e", "#16a34a", "#86efac", "#15803d"];
const EXPENSE_COLORS = ["#f87171", "#fb923c", "#facc15", "#ef4444", "#e11d48"];

function getComparisonCopy({ monthComparison, filter, previousMonthLabel }) {
  const comparisonMetricLabel =
    filter === "income" ? "ingresos" : filter === "expense" ? "gastos" : "balance";
  const comparisonColor =
    monthComparison.difference > 0
      ? "text-green-600"
      : monthComparison.difference < 0
      ? "text-red-600"
      : "text-gray-600";
  const comparisonPrefix = monthComparison.difference > 0 ? "+" : "";
  const comparisonDirection =
    monthComparison.difference > 0
      ? "mas"
      : monthComparison.difference < 0
      ? "menos"
      : "igual";
  const comparisonAbsoluteAmount = Math.abs(monthComparison.difference);

  const summaryText = !monthComparison.hasPreviousData
    ? `No hay datos en ${previousMonthLabel || "el mes anterior"} para comparar.`
    : monthComparison.difference === 0
    ? `Este mes estas igual en ${comparisonMetricLabel} que en ${previousMonthLabel}.`
    : `Este mes tienes ${formatCurrency(comparisonAbsoluteAmount)} ${comparisonDirection} de ${comparisonMetricLabel} que en ${previousMonthLabel}.`;

  const percentText =
    monthComparison.percentChange === null
      ? "No se puede calcular el porcentaje (mes anterior en 0)."
      : `Equivale a ${comparisonPrefix}${monthComparison.percentChange.toFixed(1)}% vs ${previousMonthLabel}.`;

  return {
    comparisonColor,
    comparisonPrefix,
    summaryText,
    percentText,
  };
}

export default function Dashboard() {
  const { transactions, addTransaction } = useContext(TransactionsContext);
  const { budgets, notificationSettings, createNotification } = useContext(AppContext);
  const { user } = useAuth();
  const currentMonthKey = getCurrentMonthKey();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const previousMonthKey = useMemo(() => getPreviousMonthKey(selectedMonth), [selectedMonth]);
  const selectedMonthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);
  const previousMonthLabel = useMemo(() => formatMonthLabel(previousMonthKey), [previousMonthKey]);

  const dashboardModel = useMemo(
    () =>
      buildDashboardModel({
        transactions,
        budgets,
        selectedMonth,
        previousMonthKey,
        filter,
      }),
    [transactions, budgets, selectedMonth, previousMonthKey, filter]
  );

  const {
    filteredTransactions,
    budgetStatusItems,
    data,
    totals,
    monthComparison,
    topExpenseCategory,
    criticalBudget,
    criticalBudgetProjection,
    savingsRate,
    monthlyInsight,
    financialRecommendation,
    mainUnusualExpense,
  } = dashboardModel;

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const colors =
    filter === "income"
      ? INCOME_COLORS
      : filter === "expense"
      ? EXPENSE_COLORS
      : [...INCOME_COLORS, ...EXPENSE_COLORS];

  const comparisonCopy = useMemo(
    () => getComparisonCopy({ monthComparison, filter, previousMonthLabel }),
    [monthComparison, filter, previousMonthLabel]
  );

  const handleAddTransaction = async (transaction) => {
    setLoading(true);
    try {
      const id = await addTransaction(transaction);
      if (id) {
        setCurrentPage(1);
      }
      return id;
    } catch (error) {
      logError("Error al anadir transaccion", error, {
        source: "dashboard.add-transaction",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    if (selectedMonth !== currentMonthKey) return;
    if (!budgetStatusItems.length) return;
    if (!notificationSettings?.budget80Enabled && !notificationSettings?.budget100Enabled) return;

    const storageKey = `nexofin_budget_alerts_${user.uid}_${selectedMonth}`;
    let triggered = [];

    try {
      triggered = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      triggered = [];
    }

    const triggeredSet = new Set(triggered);
    let hasChanges = false;

    budgetStatusItems.forEach((item) => {
      const milestone = getBudgetAlertMilestone(item.progress);
      const notification = buildBudgetAlertNotification({
        category: item.category,
        spent: item.spent,
        limit: item.limit,
        monthKey: selectedMonth,
        notificationSettings,
      });

      if (!notification || !milestone) return;

      const key = `${item.category}_${milestone}`;
      if (triggeredSet.has(key)) return;

      if (notification.severity === "danger") {
        toast.error(
          `Meta excedida en ${item.category}: gastaste ${formatCurrency(item.spent)} de ${formatCurrency(item.limit)}`
        );
      } else {
        toast(`Alerta: ${item.category} ya va en ${item.progress.toFixed(1)}% de su meta mensual.`);
      }

      createNotification(notification);
      triggeredSet.add(key);
      hasChanges = true;
    });

    if (hasChanges) {
      localStorage.setItem(storageKey, JSON.stringify([...triggeredSet]));
    }
  }, [
    budgetStatusItems,
    createNotification,
    currentMonthKey,
    notificationSettings,
    notificationSettings?.budget100Enabled,
    notificationSettings?.budget80Enabled,
    selectedMonth,
    user?.uid,
  ]);

  useEffect(() => {
    if (!user?.uid) return;
    if (!notificationSettings?.dailyReminderEnabled) return;

    const todayKey = getDayKey(new Date());
    if (!todayKey) return;

    const storageKey = `nexofin_daily_reminder_${user.uid}_${todayKey}`;
    const alreadyShown = localStorage.getItem(storageKey) === "1";
    if (alreadyShown) return;

    const hasMovementToday = transactions.some((transaction) => getDayKey(transaction.date) === todayKey);
    if (!hasMovementToday) {
      toast("Recordatorio: hoy aun no registras movimientos.");
      createNotification({
        type: "daily_reminder",
        title: "Recordatorio diario",
        message:
          "Hoy aun no registras movimientos. Agrega tus ingresos o gastos para mantener tu control al dia.",
        recommendation:
          "Registra al menos un movimiento hoy para mantener tu historial financiero actualizado.",
        actionPath: "/transactions",
        severity: "info",
        sourceKey: `daily-reminder-${todayKey}`,
        monthKey: currentMonthKey,
      });
    }
    localStorage.setItem(storageKey, "1");
  }, [
    createNotification,
    currentMonthKey,
    notificationSettings?.dailyReminderEnabled,
    transactions,
    user?.uid,
  ]);

  useEffect(() => {
    if (!user?.uid) return;
    if (selectedMonth !== currentMonthKey) return;
    if (!mainUnusualExpense) return;

    createNotification({
      type: "unusual_expense",
      title: `Gasto inusual: ${mainUnusualExpense.category}`,
      message: `Esta categoria subio ${formatCurrency(mainUnusualExpense.increaseAmount)} frente al mes anterior.`,
      recommendation: `Revisa las transacciones de ${mainUnusualExpense.category} y confirma si fue un gasto puntual o un nuevo patron.`,
      actionPath: `/transactions?category=${encodeURIComponent(mainUnusualExpense.category)}`,
      severity: "warning",
      sourceKey: `unusual-${selectedMonth}-${mainUnusualExpense.category}`,
      monthKey: selectedMonth,
    });
  }, [createNotification, currentMonthKey, mainUnusualExpense, selectedMonth, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    if (selectedMonth !== currentMonthKey) return;
    if (!criticalBudgetProjection) return;

    createNotification({
      type: "budget_projection",
      title: `Proyeccion de meta: ${criticalBudgetProjection.category}`,
      message: criticalBudgetProjection.estimatedExceedDay
        ? `Con tu ritmo actual podrias superar la meta cerca del dia ${criticalBudgetProjection.estimatedExceedDay}.`
        : `Con tu ritmo actual podrias cerrar en ${formatCurrency(criticalBudgetProjection.projectedSpend)}.`,
      recommendation: `Reduce el ritmo de gasto en ${criticalBudgetProjection.category} o ajusta la meta si este mes tiene gastos excepcionales.`,
      actionPath: `/transactions?category=${encodeURIComponent(criticalBudgetProjection.category)}`,
      severity: "warning",
      sourceKey: `projection-${selectedMonth}-${criticalBudgetProjection.category}`,
      monthKey: selectedMonth,
    });
  }, [createNotification, criticalBudgetProjection, currentMonthKey, selectedMonth, user?.uid]);

  return (
    <div className="relative flex flex-col gap-6 pb-20">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-start justify-center rounded-2xl bg-white/70 px-4 pt-20 backdrop-blur-sm">
          <LoadingState
            title="Guardando movimiento"
            description="Estamos actualizando tu balance, metas y alertas."
          />
        </div>
      )}

      <PageHero
        eyebrow="Centro financiero"
        title="Inicio"
        description={
          filter === "all"
            ? `Resumen ejecutivo de ${selectedMonthLabel} con balance, alertas y foco en el flujo de caja.`
            : filter === "income"
            ? `Vista enfocada en ingresos para ${selectedMonthLabel}.`
            : `Vista enfocada en gastos para ${selectedMonthLabel}.`
        }
        stats={[
          {
            label: "Balance",
            value: formatCurrency(totals.balance),
            tone: totals.balance >= 0 ? "success" : "danger",
          },
          {
            label: "Ingresos",
            value: formatCurrency(totals.ingresos),
            tone: "success",
          },
          {
            label: "Gastos",
            value: formatCurrency(totals.gastos),
            tone: "danger",
          },
          {
            label: "Ahorro",
            value: savingsRate === null ? "Sin datos" : `${savingsRate.toFixed(1)}%`,
            tone: savingsRate !== null && savingsRate >= 20 ? "success" : "default",
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                setSelectedMonth(currentMonthKey);
                setCurrentPage(1);
              }}
              variant="soft"
            >
              Ir al mes actual
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              variant="brand"
            >
              Registrar movimiento
            </Button>
          </div>
        }
      />

      <SectionPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthSelector
          label="Mes"
          value={selectedMonth || currentMonthKey}
          onChange={(nextMonth) => {
            setSelectedMonth(nextMonth || currentMonthKey);
            setCurrentPage(1);
          }}
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">Mostrando: {selectedMonthLabel}</p>
          <Button
            type="button"
            onClick={() => {
              setSelectedMonth(currentMonthKey);
              setCurrentPage(1);
            }}
            variant="soft"
            size="sm"
          >
            Mes actual
          </Button>
        </div>
      </SectionPanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionPanel className="flex h-full flex-col gap-4 bg-[#f8fbff] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#061a3d]">{formatCurrency(totals.balance)}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "all"
                ? "Balance total del mes"
                : filter === "income"
                ? "Total de ingresos del mes"
                : "Total de gastos del mes"}
            </p>
          </div>
          {filter === "all" && (
            <div className="text-left sm:text-right">
              <p className="font-semibold text-green-500">
                Ingresos: {formatCurrency(totals.ingresos)}
              </p>
              <p className="font-semibold text-red-500">
                Gastos: {formatCurrency(totals.gastos)}
              </p>
            </div>
          )}
        </SectionPanel>

        <SectionPanel className="flex h-full flex-col gap-2 bg-[#f8fbff] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">{comparisonCopy.summaryText}</p>
          {monthComparison.hasPreviousData ? (
            <div className="text-left sm:text-right">
              <p className={`font-semibold ${comparisonCopy.comparisonColor}`}>
                {comparisonCopy.comparisonPrefix}
                {formatCurrency(monthComparison.difference)}
              </p>
              <p className="text-xs text-slate-500">{comparisonCopy.percentText}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aun no hay base de comparacion.</p>
          )}
        </SectionPanel>
      </div>

      <DashboardInsights
        monthlyInsight={monthlyInsight}
        topExpenseCategory={topExpenseCategory}
        criticalBudget={criticalBudget}
        financialRecommendation={financialRecommendation}
        savingsRate={savingsRate}
        mainUnusualExpense={mainUnusualExpense}
        criticalBudgetProjection={criticalBudgetProjection}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetStatusPanel items={budgetStatusItems} />
        <CategoryDistributionPanel data={data} colors={colors} filter={filter} />
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {["all", "income", "expense"].map((value) => (
          <button
            key={value}
            onClick={() => {
              setFilter(value);
              setCurrentPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              filter === value
                ? value === "income"
                  ? "bg-green-600 text-white"
                  : value === "expense"
                  ? "bg-red-600 text-white"
                  : "bg-[#0a2b6e] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {value === "all" ? "Todas" : value === "income" ? "Ingresos" : "Gastos"}
          </button>
        ))}
      </div>

      <RecentTransactionsPanel
        transactions={currentTransactions}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <button
        onClick={() => setIsAddModalOpen(true)}
        data-testid="open-transaction-modal"
        aria-label="Anadir transaccion"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#1f67ff] to-[#11c69a] text-3xl text-white shadow-lg transition-all duration-200 hover:scale-110 sm:bottom-6 sm:right-6"
      >
        +
      </button>

      <AddTransactionModal
        show={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}
