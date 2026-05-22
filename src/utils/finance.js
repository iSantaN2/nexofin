export function isIncomeTransaction(transaction) {
  return transaction?.type === "Ingreso" || transaction?.type === "income";
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
