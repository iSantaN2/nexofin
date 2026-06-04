import React, { useContext, useEffect, useMemo, useState } from "react";
import { TransactionsContext } from "../context/TransactionsContext";
import { AppContext } from "../context/AppContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AddTransactionModal from "../components/AddTransactionModal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { AlertTriangle, Lightbulb, Target, TrendingUp } from "lucide-react";
import CategoryIcon from "../components/CategoryIcon";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import SectionPanel from "../components/ui/SectionPanel";
import {
  buildFinancialRecommendation,
  buildMonthlyInsight,
  calculateComparison,
  calculateTotals,
  getCriticalBudget,
  getCriticalBudgetProjection,
  getBudgetStatus,
  getSavingsRate,
  getTopExpenseCategory,
  getUnusualExpenseCategories,
  matchesTypeFilter,
  isIncomeTransaction,
} from "../utils/finance";
import { buildBudgetAlertNotification, getBudgetAlertMilestone } from "../utils/budgetNotifications";
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  formatSignedCurrency,
  formatTime,
  getCurrentMonthKey,
  getDayKey,
  getMonthKey,
  getMonthProgress,
  getPreviousMonthKey,
  toDate,
} from "../utils/formatters";

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
  const ITEMS_PER_PAGE = 10;

  const previousMonthKey = useMemo(
    () => getPreviousMonthKey(selectedMonth),
    [selectedMonth]
  );

  const selectedMonthLabel = useMemo(
    () => formatMonthLabel(selectedMonth),
    [selectedMonth]
  );

  const previousMonthLabel = useMemo(
    () => formatMonthLabel(previousMonthKey),
    [previousMonthKey]
  );

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(
      (t) => getMonthKey(t.date) === selectedMonth
    );

    filtered = filtered.filter((t) => matchesTypeFilter(t, filter));

    return filtered.sort((a, b) => {
      const dateA = toDate(a.createdAt || a.date) || new Date(0);
      const dateB = toDate(b.createdAt || b.date) || new Date(0);
      return dateB - dateA;
    });
  }, [transactions, filter, selectedMonth]);

  const selectedMonthTransactions = useMemo(
    () => transactions.filter((t) => getMonthKey(t.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const { ingresos, gastos, balance } = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions]
  );

  const selectedMonthTotals = useMemo(
    () => calculateTotals(selectedMonthTransactions),
    [selectedMonthTransactions]
  );

  const previousMonthTransactions = useMemo(() => {
    if (!previousMonthKey) return [];
    return transactions
      .filter((t) => getMonthKey(t.date) === previousMonthKey)
      .filter((t) => matchesTypeFilter(t, filter));
  }, [transactions, previousMonthKey, filter]);

  const previousMonthAllTransactions = useMemo(() => {
    if (!previousMonthKey) return [];
    return transactions.filter((t) => getMonthKey(t.date) === previousMonthKey);
  }, [transactions, previousMonthKey]);

  const monthExpenseByCategory = useMemo(() => {
    const totals = {};

    transactions
      .filter((t) => getMonthKey(t.date) === selectedMonth)
      .filter((t) => !isIncomeTransaction(t))
      .forEach((t) => {
        const name =
          typeof t.category === "object"
            ? t.category?.name || "Sin categoria"
            : t.category || "Sin categoria";
        totals[name] = (totals[name] || 0) + (Number(t.amount) || 0);
      });

    return totals;
  }, [transactions, selectedMonth]);

  const budgetStatusItems = useMemo(() => {
    return budgets
      .filter((item) => item.monthKey === selectedMonth)
      .map((item) => {
        const limit = Number(item.limitAmount) || 0;
        const spent = monthExpenseByCategory[item.category] || 0;
        const progress = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = limit - spent;

        return {
          ...item,
          limit,
          spent,
          progress,
          remaining,
          status: getBudgetStatus(progress),
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [budgets, monthExpenseByCategory, selectedMonth]);

  const previousTotals = useMemo(
    () => calculateTotals(previousMonthTransactions),
    [previousMonthTransactions]
  );

  const previousAllTotals = useMemo(
    () => calculateTotals(previousMonthAllTransactions),
    [previousMonthAllTransactions]
  );

  const monthComparison = useMemo(() => {
    return calculateComparison(
      { ingresos, gastos, balance },
      previousTotals,
      filter,
      previousMonthTransactions.length > 0
    );
  }, [ingresos, gastos, balance, filter, previousTotals, previousMonthTransactions]);

  const topExpenseCategory = useMemo(
    () => getTopExpenseCategory(selectedMonthTransactions),
    [selectedMonthTransactions]
  );

  const criticalBudget = useMemo(
    () => getCriticalBudget(budgetStatusItems),
    [budgetStatusItems]
  );

  const monthProjectionDates = useMemo(
    () => getMonthProgress(selectedMonth),
    [selectedMonth]
  );

  const criticalBudgetProjection = useMemo(
    () => getCriticalBudgetProjection(budgetStatusItems, monthProjectionDates),
    [budgetStatusItems, monthProjectionDates]
  );

  const savingsRate = useMemo(
    () => getSavingsRate(selectedMonthTotals),
    [selectedMonthTotals]
  );

  const monthlyInsight = useMemo(
    () =>
      buildMonthlyInsight({
        totals: selectedMonthTotals,
        previousTotals: previousAllTotals,
        hasPreviousData: previousMonthAllTransactions.length > 0,
        topExpenseCategory,
        criticalBudget,
      }),
    [
      criticalBudget,
      previousAllTotals,
      previousMonthAllTransactions.length,
      selectedMonthTotals,
      topExpenseCategory,
    ]
  );

  const financialRecommendation = useMemo(
    () =>
      buildFinancialRecommendation({
        totals: selectedMonthTotals,
        topExpenseCategory,
        criticalBudget,
      }),
    [criticalBudget, selectedMonthTotals, topExpenseCategory]
  );

  const unusualExpenses = useMemo(
    () =>
      getUnusualExpenseCategories(selectedMonthTransactions, previousMonthAllTransactions, {
        minIncreasePercent: 25,
        minIncreaseAmount: 20,
      }),
    [previousMonthAllTransactions, selectedMonthTransactions]
  );

  const mainUnusualExpense = unusualExpenses[0] || null;

  const data = useMemo(() => {
    const categorias = {};
    filteredTransactions.forEach((t) => {
      const monto = Number(t.amount) || 0;
      const name =
        typeof t.category === "object"
          ? t.category?.name || "Sin categoria"
          : t.category || "Sin categoria";
      categorias[name] = (categorias[name] || 0) + monto;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const incomeColors = ["#4ade80", "#22c55e", "#16a34a", "#86efac", "#15803d"];
  const expenseColors = ["#f87171", "#fb923c", "#facc15", "#ef4444", "#e11d48"];
  const COLORS =
    filter === "income"
      ? incomeColors
      : filter === "expense"
      ? expenseColors
      : [...incomeColors, ...expenseColors];

  const handleAddTransaction = async (transaction) => {
    setLoading(true);
    try {
      const id = await addTransaction(transaction);
      if (id) {
        setCurrentPage(1);
      }
      return id;
    } catch (err) {
      console.error("Error al anadir transaccion:", err);
      toast.error("Error al anadir transaccion");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const comparisonSummaryText = !monthComparison.hasPreviousData
    ? `No hay datos en ${previousMonthLabel || "el mes anterior"} para comparar.`
    : monthComparison.difference === 0
    ? `Este mes estas igual en ${comparisonMetricLabel} que en ${previousMonthLabel}.`
    : `Este mes tienes ${formatCurrency(comparisonAbsoluteAmount)} ${comparisonDirection} de ${comparisonMetricLabel} que en ${previousMonthLabel}.`;

  const comparisonPercentText =
    monthComparison.percentChange === null
      ? "No se puede calcular el porcentaje (mes anterior en 0)."
      : `Equivale a ${comparisonPrefix}${monthComparison.percentChange.toFixed(1)}% vs ${previousMonthLabel}.`;

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

    const hasMovementToday = transactions.some((tx) => getDayKey(tx.date) === todayKey);
    if (!hasMovementToday) {
      toast("Recordatorio: hoy aun no registras movimientos.");
      createNotification({
        type: "daily_reminder",
        title: "Recordatorio diario",
        message: "Hoy aun no registras movimientos. Agrega tus ingresos o gastos para mantener tu control al dia.",
        recommendation: "Registra al menos un movimiento hoy para mantener tu historial financiero actualizado.",
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
    <div className="flex flex-col gap-6 pb-20 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-50">
          <div className="animate-spin w-10 h-10 border-4 border-[#1f67ff] border-t-transparent rounded-full"></div>
        </div>
      )}

      <PageHeader
        title="Inicio"
        description={
          filter === "all"
            ? "Resumen del mes seleccionado"
            : filter === "income"
            ? "Solo ingresos del mes seleccionado"
            : "Solo gastos del mes seleccionado"
        }
      />

      <SectionPanel className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Mes</label>
          <input
            type="month"
            value={selectedMonth || ""}
            onChange={(e) => {
              setSelectedMonth(e.target.value || currentMonthKey);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">Mostrando: {selectedMonthLabel}</p>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(currentMonthKey);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            Mes actual
          </button>
        </div>
      </SectionPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionPanel className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-full">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(balance)}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filter === "all"
                ? "Balance total del mes"
                : filter === "income"
                ? "Total de ingresos del mes"
                : "Total de gastos del mes"}
            </p>
          </div>
          {filter === "all" && (
            <div className="text-left sm:text-right">
              <p className="text-green-500 font-semibold">
                Ingresos: {formatCurrency(ingresos)}
              </p>
              <p className="text-red-500 font-semibold">
                Gastos: {formatCurrency(gastos)}
              </p>
            </div>
          )}
        </SectionPanel>

        <SectionPanel className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 h-full">
          <p className="text-sm text-gray-600">{comparisonSummaryText}</p>
          {monthComparison.hasPreviousData ? (
            <div className="text-left sm:text-right">
              <p className={`font-semibold ${comparisonColor}`}>
                {comparisonPrefix}{formatCurrency(monthComparison.difference)}
              </p>
              <p className="text-xs text-gray-500">{comparisonPercentText}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aun no hay base de comparacion.</p>
          )}
        </SectionPanel>
      </div>

      <SectionPanel title="Inteligencia financiera">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
          <div className="rounded-lg border border-[#dbe8ff] bg-[#f8fbff] p-4">
            <div className="flex items-center gap-2 text-[#0a2b6e]">
              <Lightbulb className="w-4 h-4" />
              <p className="text-sm font-semibold">Insight del mes</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{monthlyInsight}</p>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm font-semibold">Mayor gasto</p>
            </div>
            {topExpenseCategory ? (
              <>
                <p className="mt-2 text-lg font-bold text-red-700">
                  {formatCurrency(topExpenseCategory.amount)}
                </p>
                <p className="text-sm text-slate-600">{topExpenseCategory.category}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Sin gastos registrados este mes.</p>
            )}
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Target className="w-4 h-4" />
              <p className="text-sm font-semibold">Meta critica</p>
            </div>
            {criticalBudget ? (
              <>
                <p className={`mt-2 text-lg font-bold ${criticalBudget.status.textColor}`}>
                  {criticalBudget.progress.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600">{criticalBudget.category}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Aun no hay metas para evaluar.</p>
            )}
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-semibold">Recomendacion</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{financialRecommendation}</p>
            {savingsRate !== null ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Ahorro estimado: {savingsRate.toFixed(1)}%
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-semibold">Gasto inusual</p>
            </div>
            {mainUnusualExpense ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {mainUnusualExpense.category}
                </p>
                <p className="text-sm text-slate-600">
                  Subio {formatCurrency(mainUnusualExpense.increaseAmount)}
                  {mainUnusualExpense.increasePercent !== null
                    ? ` (${mainUnusualExpense.increasePercent.toFixed(1)}%)`
                    : " respecto al mes anterior"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No se detectan aumentos fuertes vs el mes anterior.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
            <div className="flex items-center gap-2 text-sky-700">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm font-semibold">Proyeccion de meta</p>
            </div>
            {criticalBudgetProjection ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {criticalBudgetProjection.category}
                </p>
                <p className="text-sm text-slate-600">
                  Podrias cerrar en {formatCurrency(criticalBudgetProjection.projectedSpend)}
                  {criticalBudgetProjection.estimatedExceedDay
                    ? ` y superar la meta cerca del dia ${criticalBudgetProjection.estimatedExceedDay}.`
                    : "."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Tus metas no proyectan exceso con el ritmo actual.
              </p>
            )}
          </div>
        </div>
      </SectionPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-2xl p-6 h-full flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4 min-h-9">
            <h3 className="font-semibold">Metas del mes</h3>
            <Link
              to="/budgets"
              className="text-sm px-3 py-1.5 rounded-lg bg-[#e9f2ff] text-[#0a2b6e] hover:bg-[#d9ecff]"
            >
              Ir a Metas
            </Link>
          </div>
          {budgetStatusItems.length === 0 ? (
            <div className="space-y-3 flex-1">
              <p className="text-sm text-gray-500">
                No hay metas configuradas para este mes. Puedes crearlas en la seccion Metas.
              </p>
              <Link
                to="/budgets"
                className="inline-flex text-sm px-3 py-2 rounded-lg bg-[#0a2b6e] text-white hover:bg-[#081f52]"
              >
                Crear meta
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {budgetStatusItems.map((item) => {
                const progressSafe = Math.max(0, Math.min(item.progress, 100));
                return (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{item.category}</p>
                        <p className="text-sm text-gray-600">
                          Gastado: <span className="font-medium">{formatCurrency(item.spent)}</span> de
                          <span className="font-medium"> {formatCurrency(item.limit)}</span>
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${item.status.textColor}`}>
                          {item.status.label} - {item.progress.toFixed(1)}%
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 text-right">
                        {item.remaining >= 0
                          ? `Restan ${formatCurrency(item.remaining)}`
                          : `Exceso ${formatCurrency(Math.abs(item.remaining))}`}
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
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
        </div>

        <div className="bg-white shadow rounded-2xl p-6 h-full flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4 min-h-9">
            <h3 className="font-semibold">Distribucion por categoria</h3>
            <span className="inline-flex px-3 py-1.5 text-sm opacity-0 select-none" aria-hidden>
              Placeholder
            </span>
          </div>
          <div className="flex-1">
            <AnimatePresence mode="wait">
            {data.length === 0 ? (
              <motion.div
                key="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState title="No hay datos para mostrar." />
              </motion.div>
            ) : (
              <motion.div
                key={filter}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 h-full"
              >
                <div className="flex justify-center w-full xl:w-1/2 h-[260px] xl:h-[240px] min-w-0 min-h-[240px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                      >
                        {data.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center w-full xl:w-1/2">
                  {data.map((entry, idx) => {
                    const total = data.reduce((sum, d) => sum + d.value, 0);
                    const percent = ((entry.value / total) * 100).toFixed(1);
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          ></span>
                          <span className="text-gray-700">{entry.name}</span>
                        </div>
                        <span className="text-gray-500">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-3 mt-4">
        {["all", "income", "expense"].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filter === f
                ? f === "income"
                  ? "bg-green-600 text-white"
                  : f === "expense"
                  ? "bg-red-600 text-white"
                  : "bg-[#0a2b6e] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Todas" : f === "income" ? "Ingresos" : "Gastos"}
          </button>
        ))}
      </div>


      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Transacciones recientes</h3>
        {currentTransactions.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No hay transacciones.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTransactions.map((t) => {
              const isIncome = t.type === "Ingreso" || t.type === "income";
              return (
                <li
                  key={t.id}
                  className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={t.category} type={t.type} />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {t.category || "Sin categoria"}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                      <p className="text-xs text-gray-400">
                        {formatTime(t.createdAt || t.date)} · {t.account}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold text-base ${
                      isIncome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatSignedCurrency(t.amount, { income: isIncome })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentPage === i + 1
                    ? "bg-[#0a2b6e] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsAddModalOpen(true)}
        data-testid="open-transaction-modal"
        aria-label="Anadir transaccion"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#1f67ff] to-[#11c69a] text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl shadow-lg transition-all duration-200 hover:scale-110"
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










