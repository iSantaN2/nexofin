import {
  calculateTotals,
  getBudgetProjection,
  getExpenseTotalsByCategory,
} from "../utils/finance";
import { formatCurrency } from "../utils/formatters";

export function getBudgetMonthDays(monthKey) {
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
}

export function getBudgetViewStatus(progress) {
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
}

function getBudgetRecommendation(item) {
  if (item.progress >= 100) {
    return `Ya superaste esta meta por ${formatCurrency(Math.abs(item.remaining))}. Revisa los ultimos gastos o ajusta el limite si fue un gasto excepcional.`;
  }

  if (item.progress >= 80) {
    return `Quedan ${formatCurrency(Math.max(0, item.remaining))}. Manten los gastos de esta categoria por debajo de ese monto para cerrar bien el mes.`;
  }

  if (item.projectedExceeded) {
    return `Aunque hoy luce saludable, al ritmo actual podria superar la meta cerca del dia ${item.estimatedExceedDay}.`;
  }

  return `Vas dentro del limite. Puedes usar hasta ${formatCurrency(Math.max(0, item.remaining))} sin superar la meta.`;
}

export function getBudgetMonthTotals(monthTransactions = []) {
  const totals = calculateTotals(monthTransactions);
  return {
    income: totals.ingresos,
    expenses: totals.gastos,
  };
}

export function getBudgetSpentByCategory(monthTransactions = []) {
  return getExpenseTotalsByCategory(monthTransactions);
}

export function buildBudgetCards({ budgets = [], spentByCategory = {}, monthDays } = {}) {
  const safeMonthDays = monthDays || getBudgetMonthDays();

  return budgets
    .map((budget) => {
      const spent = spentByCategory[budget.category] || 0;
      const limit = Number(budget.limitAmount) || 0;
      const progress = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = limit - spent;
      const projection = getBudgetProjection(
        { ...budget, spent, limit },
        {
          currentDay: safeMonthDays.currentDay,
          daysInMonth: safeMonthDays.daysInMonth,
        }
      );

      const item = {
        ...budget,
        spent,
        limit,
        remaining,
        progress,
        status: getBudgetViewStatus(progress),
        dailyAverage: projection?.dailyAverage || 0,
        projectedSpend: projection?.projectedSpend || 0,
        projectedExceeded: Boolean(projection?.projectedExceeded),
        estimatedExceedDay: projection?.estimatedExceedDay || null,
      };

      return {
        ...item,
        recommendation: getBudgetRecommendation(item),
      };
    })
    .sort((a, b) => b.progress - a.progress);
}

export function getBudgetSummary({ budgetCards = [], monthTotals = {} } = {}) {
  const totalLimit = budgetCards.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = budgetCards.reduce((sum, item) => sum + item.spent, 0);
  const projectedTotal = budgetCards.reduce((sum, item) => sum + (item.projectedSpend || 0), 0);
  const exceeded = budgetCards.filter((item) => item.status.key === "exceeded");
  const risk = budgetCards.filter((item) => item.status.key === "risk");
  const healthy = budgetCards.filter((item) => item.status.key === "healthy");
  const progress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const income = Number(monthTotals.income) || 0;
  const expenses = Number(monthTotals.expenses) || 0;
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : null;
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
}
