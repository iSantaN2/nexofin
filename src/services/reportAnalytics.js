import dayjs from "dayjs";
import { calculateTotals, getTransactionType, normalizeTransactionField } from "../utils/finance";

export const PERIODS = [
  { value: "7days", label: "Ultimos 7 dias" },
  { value: "30days", label: "Ultimos 30 dias" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Todo" },
];

export function getPeriodLabel(filter) {
  return PERIODS.find((item) => item.value === filter)?.label || "Todo";
}

export function normalizeReportTransactions(transactions = []) {
  return transactions
    .map((tx) => {
      const date = tx.date?.seconds ? dayjs.unix(tx.date.seconds) : dayjs(tx.date);
      const createdAt = tx.createdAt?.seconds
        ? dayjs.unix(tx.createdAt.seconds)
        : tx.createdAt
        ? dayjs(tx.createdAt)
        : date;

      return {
        ...tx,
        amount: Number(tx.amount) || 0,
        type: getTransactionType(tx),
        category: normalizeTransactionField(tx.category, "Sin categoria"),
        account: normalizeTransactionField(tx.account, "Sin metodo"),
        notes: tx.notes || "",
        date,
        createdAt,
      };
    })
    .filter((tx) => tx.date?.isValid?.());
}

export function formatAccountingDateTime(tx) {
  return `${tx.date.format("DD/MM/YYYY")} ${tx.createdAt.format("HH:mm")}`;
}

export function getPeriodRange(filter, now = dayjs()) {
  if (filter === "all") {
    return {
      label: "Todo el historial",
      start: null,
      end: null,
      previousStart: null,
      previousEnd: null,
    };
  }

  if (filter === "7days") {
    const start = now.subtract(6, "day").startOf("day");
    const end = now.endOf("day");
    return {
      label: "Ultimos 7 dias",
      start,
      end,
      previousStart: start.subtract(7, "day"),
      previousEnd: end.subtract(7, "day"),
    };
  }

  if (filter === "30days") {
    const start = now.subtract(29, "day").startOf("day");
    const end = now.endOf("day");
    return {
      label: "Ultimos 30 dias",
      start,
      end,
      previousStart: start.subtract(30, "day"),
      previousEnd: end.subtract(30, "day"),
    };
  }

  if (filter === "week") {
    const start = now.startOf("week");
    const end = now.endOf("week");
    return {
      label: "Semana actual",
      start,
      end,
      previousStart: start.subtract(1, "week"),
      previousEnd: end.subtract(1, "week"),
    };
  }

  if (filter === "month") {
    const start = now.startOf("month");
    const end = now.endOf("month");
    return {
      label: "Mes actual",
      start,
      end,
      previousStart: start.subtract(1, "month"),
      previousEnd: end.subtract(1, "month"),
    };
  }

  const start = now.startOf("year");
  const end = now.endOf("year");
  return {
    label: "Ano actual",
    start,
    end,
    previousStart: start.subtract(1, "year"),
    previousEnd: end.subtract(1, "year"),
  };
}

function isInRange(date, start, end) {
  if (!start || !end) return true;
  if (!date?.isValid?.()) return false;
  return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
}

export function getReportCategories(transactions = []) {
  return ["todos", ...new Set(transactions.map((tx) => tx.category).filter(Boolean))];
}

export function filterTransactionsByRange(transactions = [], range = {}) {
  return transactions.filter((tx) => isInRange(tx.date, range.start, range.end));
}

export function filterTransactionsByCategory(transactions = [], selectedCategory = "todos") {
  if (selectedCategory === "todos") return transactions;
  return transactions.filter((tx) => tx.category === selectedCategory);
}

function buildRangeLabel(filter) {
  switch (filter) {
    case "7days":
      return "7dias";
    case "30days":
      return "30dias";
    case "week":
      return "semana";
    case "month":
      return "mes";
    case "year":
      return "anio";
    default:
      return "general";
  }
}

export function buildBaseFileName(filter, selectedCategory, now = dayjs()) {
  const dateStamp = now.format("YYYYMMDD_HHmm");
  const categoryStamp = selectedCategory === "todos" ? "todas" : selectedCategory;
  return `NexoFin_${buildRangeLabel(filter)}_${categoryStamp}_${dateStamp}`;
}

export function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function getReportComparison(totals, previousTotals) {
  const diffBalance = totals.balance - previousTotals.balance;
  const diffIncome = totals.ingresos - previousTotals.ingresos;
  const diffExpense = totals.gastos - previousTotals.gastos;
  const pctBalance =
    previousTotals.balance === 0 ? null : (diffBalance / Math.abs(previousTotals.balance)) * 100;

  return { diffBalance, diffIncome, diffExpense, pctBalance };
}

export function getAverageTicket(transactions = [], totals = {}) {
  const incomeItems = transactions.filter((tx) => tx.type === "Ingreso");
  const expenseItems = transactions.filter((tx) => tx.type === "Gasto");

  return {
    incomeAvg: incomeItems.length ? totals.ingresos / incomeItems.length : 0,
    expenseAvg: expenseItems.length ? totals.gastos / expenseItems.length : 0,
  };
}

export function getReportHealth(totals) {
  const savingsRate = totals.ingresos > 0 ? (totals.balance / totals.ingresos) * 100 : 0;

  if (savingsRate >= 20) {
    return {
      label: "Saludable",
      color: "text-emerald-600",
      description: `Ahorro ${savingsRate.toFixed(1)}%`,
    };
  }

  if (savingsRate >= 5) {
    return {
      label: "Atencion",
      color: "text-amber-600",
      description: `Ahorro ${savingsRate.toFixed(1)}%`,
    };
  }

  return {
    label: "Riesgo",
    color: "text-red-600",
    description: `Ahorro ${savingsRate.toFixed(1)}%`,
  };
}

export function getTopExpenseCategories(transactions = [], totalExpenses = 0) {
  const grouped = {};

  transactions
    .filter((tx) => tx.type === "Gasto")
    .forEach((tx) => {
      grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
    });

  const safeTotalExpense = totalExpenses || 1;
  return Object.entries(grouped)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: (amount / safeTotalExpense) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

export function getMethodsBreakdown(transactions = []) {
  const grouped = {};

  transactions
    .filter((tx) => tx.type === "Gasto")
    .forEach((tx) => {
      grouped[tx.account] = (grouped[tx.account] || 0) + tx.amount;
    });

  return Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildTrendData({ transactions = [], selectedCategory = "todos", now = dayjs() } = {}) {
  return Array.from({ length: 6 }).map((_, index) => {
    const month = now.startOf("month").subtract(5 - index, "month");
    const monthKey = month.format("YYYY-MM");

    const monthTransactions = transactions.filter((tx) => {
      if (tx.date.format("YYYY-MM") !== monthKey) return false;
      if (selectedCategory === "todos") return true;
      return tx.category === selectedCategory;
    });

    const monthTotals = calculateTotals(monthTransactions);
    return {
      month: month.format("MMM"),
      ingresos: monthTotals.ingresos,
      gastos: monthTotals.gastos,
      balance: monthTotals.balance,
    };
  });
}

export function buildPeriodBarData({ rangeLabel, totals } = {}) {
  return [{ name: rangeLabel, ingresos: totals.ingresos, gastos: totals.gastos }];
}

export function buildReportInsights({
  topExpenseCategories = [],
  previousTransactionsLength = 0,
  diffExpense = 0,
  methodsBreakdown = [],
} = {}) {
  const lines = [];

  if (topExpenseCategories[0]) {
    lines.push(
      `Tu mayor gasto fue ${topExpenseCategories[0].name} con S/ ${topExpenseCategories[0].amount.toFixed(2)}.`
    );
  }

  if (previousTransactionsLength > 0) {
    const direction = diffExpense > 0 ? "mas" : "menos";
    lines.push(`Gastaste S/ ${Math.abs(diffExpense).toFixed(2)} ${direction} que el periodo anterior.`);
  }

  if (methodsBreakdown[0]) {
    lines.push(`Tu metodo mas usado fue ${methodsBreakdown[0].name}.`);
  }

  return lines;
}
