export function getTransactionType(value) {
  const rawType = typeof value === "object" ? value?.type : value;
  return rawType === "Ingreso" || rawType === "income" ? "Ingreso" : "Gasto";
}

export function isIncomeTransaction(transaction) {
  return getTransactionType(transaction) === "Ingreso";
}

export function normalizeTransactionField(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value.name || fallback;
  return value;
}

export function normalizeComparableText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function matchesTypeFilter(transaction, filter) {
  if (filter === "income") return isIncomeTransaction(transaction);
  if (filter === "expense") return !isIncomeTransaction(transaction);
  return true;
}

export function calculateTotals(items = []) {
  let ingresos = 0;
  let gastos = 0;

  items.forEach((item) => {
    const amount = Number(item?.amount) || 0;
    if (isIncomeTransaction(item)) ingresos += amount;
    else gastos += amount;
  });

  return { ingresos, gastos, balance: ingresos - gastos };
}

export function getPrimaryMetricValue(totals, filter) {
  if (filter === "income") return totals.ingresos;
  if (filter === "expense") return totals.gastos;
  return totals.balance;
}

export function calculateComparison(currentTotals, previousTotals, filter, hasPreviousData) {
  const currentValue = getPrimaryMetricValue(currentTotals, filter);
  const previousValue = getPrimaryMetricValue(previousTotals, filter);
  const difference = currentValue - previousValue;
  const percentChange =
    previousValue === 0 ? null : (difference / Math.abs(previousValue)) * 100;

  return {
    difference,
    percentChange,
    hasPreviousData: Boolean(hasPreviousData),
  };
}

export function getBudgetStatus(progress) {
  if (progress >= 100) {
    return { label: "Excedido", textColor: "text-red-600", barColor: "bg-red-500" };
  }
  if (progress >= 80) {
    return { label: "En riesgo", textColor: "text-amber-600", barColor: "bg-amber-500" };
  }
  return { label: "Saludable", textColor: "text-green-600", barColor: "bg-green-500" };
}

export function getTopExpenseCategory(items = []) {
  const grouped = {};

  items.forEach((item) => {
    if (isIncomeTransaction(item)) return;

    const category =
      typeof item?.category === "object"
        ? item.category?.name || "Sin categoría"
        : item?.category || "Sin categoría";
    grouped[category] = (grouped[category] || 0) + (Number(item?.amount) || 0);
  });

  const [category, amount] =
    Object.entries(grouped).sort((a, b) => b[1] - a[1])[0] || [];

  return category ? { category, amount } : null;
}

export function getCriticalBudget(items = []) {
  return (
    items
      .filter((item) => Number(item?.limit) > 0)
      .sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0))[0] || null
  );
}

export function getSavingsRate(totals = {}) {
  const income = Number(totals.ingresos) || 0;
  const balance = Number(totals.balance) || 0;
  if (income <= 0) return null;
  return (balance / income) * 100;
}

export function buildMonthlyInsight({
  totals,
  previousTotals,
  hasPreviousData,
  topExpenseCategory,
  criticalBudget,
} = {}) {
  const currentBalance = Number(totals?.balance) || 0;
  const previousBalance = Number(previousTotals?.balance) || 0;

  if (criticalBudget?.progress >= 100) {
    return `Tu prioridad este mes es ${criticalBudget.category}: ya superó su meta.`;
  }

  if (criticalBudget?.progress >= 80) {
    return `Vigila ${criticalBudget.category}: está cerca de superar su meta mensual.`;
  }

  if (hasPreviousData && currentBalance > previousBalance) {
    return "Tu balance va mejor que el mes anterior. Mantener este ritmo sería una buena señal.";
  }

  if (hasPreviousData && currentBalance < previousBalance) {
    return "Tu balance bajó frente al mes anterior. Conviene revisar los gastos principales.";
  }

  if (topExpenseCategory) {
    return `${topExpenseCategory.category} concentra tu mayor gasto del mes.`;
  }

  return "Aún faltan movimientos para generar un insight financiero fuerte.";
}

export function buildFinancialRecommendation({ totals, topExpenseCategory, criticalBudget } = {}) {
  const savingsRate = getSavingsRate(totals);

  if (criticalBudget?.progress >= 100) {
    return `Reduce o pausa gastos en ${criticalBudget.category} hasta cerrar el mes.`;
  }

  if (criticalBudget?.progress >= 80) {
    return `Reserva un margen para ${criticalBudget.category}; estás cerca del límite.`;
  }

  if (savingsRate !== null && savingsRate < 10) {
    return "Intenta separar al menos 10% de tus ingresos antes de nuevos gastos variables.";
  }

  if (topExpenseCategory) {
    return `Revisa si puedes optimizar ${topExpenseCategory.category}, tu categoría de mayor gasto.`;
  }

  return "Registra movimientos con frecuencia para que NexoFin pueda darte mejores recomendaciones.";
}

export function getExpenseTotalsByCategory(items = []) {
  const grouped = {};

  items.forEach((item) => {
    if (isIncomeTransaction(item)) return;

    const category =
      typeof item?.category === "object"
        ? item.category?.name || "Sin categoría"
        : item?.category || "Sin categoría";

    grouped[category] = (grouped[category] || 0) + (Number(item?.amount) || 0);
  });

  return grouped;
}

export function getUnusualExpenseCategories(
  currentItems = [],
  previousItems = [],
  { minIncreasePercent = 25, minIncreaseAmount = 20 } = {}
) {
  const currentByCategory = getExpenseTotalsByCategory(currentItems);
  const previousByCategory = getExpenseTotalsByCategory(previousItems);

  return Object.entries(currentByCategory)
    .map(([category, currentAmount]) => {
      const previousAmount = previousByCategory[category] || 0;
      const increaseAmount = currentAmount - previousAmount;
      const increasePercent =
        previousAmount > 0 ? (increaseAmount / previousAmount) * 100 : null;

      return {
        category,
        currentAmount,
        previousAmount,
        increaseAmount,
        increasePercent,
        isNewExpense: previousAmount === 0 && currentAmount >= minIncreaseAmount,
      };
    })
    .filter((item) => {
      if (item.increaseAmount < minIncreaseAmount) return false;
      if (item.isNewExpense) return true;
      return item.increasePercent !== null && item.increasePercent >= minIncreasePercent;
    })
    .sort((a, b) => b.increaseAmount - a.increaseAmount);
}

export function getBudgetProjection(
  budget,
  { currentDay = new Date().getDate(), daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() } = {}
) {
  const spent = Number(budget?.spent) || 0;
  const limit = Number(budget?.limit) || 0;
  const safeCurrentDay = Math.max(1, Number(currentDay) || 1);
  const safeDaysInMonth = Math.max(safeCurrentDay, Number(daysInMonth) || safeCurrentDay);

  if (limit <= 0 || spent <= 0) {
    return null;
  }

  const dailyAverage = spent / safeCurrentDay;
  const projectedSpend = dailyAverage * safeDaysInMonth;
  const projectedOverAmount = projectedSpend - limit;
  const projectedProgress = (projectedSpend / limit) * 100;
  const projectedExceeded = projectedSpend > limit;
  const estimatedExceedDay = projectedExceeded
    ? Math.min(safeDaysInMonth, Math.ceil(limit / dailyAverage))
    : null;

  return {
    category: budget.category,
    spent,
    limit,
    dailyAverage,
    projectedSpend,
    projectedOverAmount,
    projectedProgress,
    projectedExceeded,
    estimatedExceedDay,
  };
}

export function getCriticalBudgetProjection(
  budgets = [],
  { currentDay, daysInMonth } = {}
) {
  return (
    budgets
      .map((budget) => getBudgetProjection(budget, { currentDay, daysInMonth }))
      .filter(Boolean)
      .filter((projection) => projection.projectedExceeded)
      .sort((a, b) => b.projectedOverAmount - a.projectedOverAmount)[0] || null
  );
}
