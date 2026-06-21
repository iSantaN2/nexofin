import {
  buildFinancialRecommendation,
  buildMonthlyInsight,
  calculateComparison,
  calculateTotals,
  getBudgetStatus,
  getCriticalBudget,
  getCriticalBudgetProjection,
  getExpenseTotalsByCategory,
  getSavingsRate,
  getTopExpenseCategory,
  getUnusualExpenseCategories,
  matchesTypeFilter,
} from "../utils/finance";
import { getMonthKey, getMonthProgress, toDate } from "../utils/formatters";

function getMonthTransactions(transactions = [], monthKey) {
  return transactions.filter((transaction) => getMonthKey(transaction.date) === monthKey);
}

export function getFilteredMonthTransactions(transactions = [], monthKey, filter = "all") {
  return getMonthTransactions(transactions, monthKey)
    .filter((transaction) => matchesTypeFilter(transaction, filter))
    .sort((left, right) => {
      const leftDate = toDate(left.createdAt || left.date) || new Date(0);
      const rightDate = toDate(right.createdAt || right.date) || new Date(0);
      return rightDate - leftDate;
    });
}

export function getBudgetStatusItems({
  budgets = [],
  monthExpenseByCategory = {},
  selectedMonth,
} = {}) {
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
}

export function getCategoryDistributionData(transactions = []) {
  const grouped = {};

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    const category =
      typeof transaction.category === "object"
        ? transaction.category?.name || "Sin categoria"
        : transaction.category || "Sin categoria";
    grouped[category] = (grouped[category] || 0) + amount;
  });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function getDashboardComparison({
  filteredTransactions = [],
  previousMonthTransactions = [],
  filter = "all",
} = {}) {
  const currentTotals = calculateTotals(filteredTransactions);
  const previousTotals = calculateTotals(previousMonthTransactions);

  return {
    totals: currentTotals,
    previousTotals,
    monthComparison: calculateComparison(
      currentTotals,
      previousTotals,
      filter,
      previousMonthTransactions.length > 0
    ),
  };
}

function getDashboardInsights({
  selectedMonthTransactions = [],
  previousMonthAllTransactions = [],
  budgetStatusItems = [],
  selectedMonth,
} = {}) {
  const selectedMonthTotals = calculateTotals(selectedMonthTransactions);
  const previousAllTotals = calculateTotals(previousMonthAllTransactions);
  const topExpenseCategory = getTopExpenseCategory(selectedMonthTransactions);
  const criticalBudget = getCriticalBudget(budgetStatusItems);
  const monthProjectionDates = getMonthProgress(selectedMonth);
  const criticalBudgetProjection = getCriticalBudgetProjection(
    budgetStatusItems,
    monthProjectionDates
  );
  const savingsRate = getSavingsRate(selectedMonthTotals);
  const monthlyInsight = buildMonthlyInsight({
    totals: selectedMonthTotals,
    previousTotals: previousAllTotals,
    hasPreviousData: previousMonthAllTransactions.length > 0,
    topExpenseCategory,
    criticalBudget,
  });
  const financialRecommendation = buildFinancialRecommendation({
    totals: selectedMonthTotals,
    topExpenseCategory,
    criticalBudget,
  });
  const unusualExpenses = getUnusualExpenseCategories(
    selectedMonthTransactions,
    previousMonthAllTransactions,
    {
      minIncreasePercent: 25,
      minIncreaseAmount: 20,
    }
  );

  return {
    selectedMonthTotals,
    previousAllTotals,
    topExpenseCategory,
    criticalBudget,
    monthProjectionDates,
    criticalBudgetProjection,
    savingsRate,
    monthlyInsight,
    financialRecommendation,
    unusualExpenses,
    mainUnusualExpense: unusualExpenses[0] || null,
  };
}

export function buildDashboardModel({
  transactions = [],
  budgets = [],
  selectedMonth,
  previousMonthKey,
  filter = "all",
} = {}) {
  const filteredTransactions = getFilteredMonthTransactions(transactions, selectedMonth, filter);
  const selectedMonthTransactions = getMonthTransactions(transactions, selectedMonth);
  const previousMonthTransactions = previousMonthKey
    ? getFilteredMonthTransactions(transactions, previousMonthKey, filter)
    : [];
  const previousMonthAllTransactions = previousMonthKey
    ? getMonthTransactions(transactions, previousMonthKey)
    : [];
  const monthExpenseByCategory = getExpenseTotalsByCategory(selectedMonthTransactions);
  const budgetStatusItems = getBudgetStatusItems({
    budgets,
    monthExpenseByCategory,
    selectedMonth,
  });
  const { totals, previousTotals, monthComparison } = getDashboardComparison({
    filteredTransactions,
    previousMonthTransactions,
    filter,
  });
  const insights = getDashboardInsights({
    selectedMonthTransactions,
    previousMonthAllTransactions,
    budgetStatusItems,
    selectedMonth,
  });

  return {
    filteredTransactions,
    selectedMonthTransactions,
    previousMonthTransactions,
    previousMonthAllTransactions,
    monthExpenseByCategory,
    budgetStatusItems,
    data: getCategoryDistributionData(filteredTransactions),
    totals,
    previousTotals,
    monthComparison,
    ...insights,
  };
}
