import { formatCurrency } from "./formatters";

export function getBudgetAlertMilestone(progress) {
  const safeProgress = Number(progress) || 0;

  if (safeProgress >= 100) return "100";
  if (safeProgress >= 90) return "90";
  if (safeProgress >= 80) return "80";
  return null;
}

export function buildBudgetAlertNotification({
  category,
  spent,
  limit,
  monthKey,
  notificationSettings,
  reactivate = false,
}) {
  const safeCategory = String(category || "").trim();
  const safeMonthKey = String(monthKey || "").trim();
  const safeSpent = Number(spent) || 0;
  const safeLimit = Number(limit) || 0;

  if (!safeCategory || !safeMonthKey || safeLimit <= 0) return null;

  const progress = (safeSpent / safeLimit) * 100;
  const milestone = getBudgetAlertMilestone(progress);
  if (!milestone) return null;

  const isExceeded = milestone === "100";
  const isHighRisk = milestone === "90";
  const remaining = safeLimit - safeSpent;

  if (isExceeded && !notificationSettings?.budget100Enabled) return null;
  if (!isExceeded && !notificationSettings?.budget80Enabled) return null;

  return {
    type: isExceeded ? "budget_limit" : "budget_warning",
    title: isExceeded
      ? `Meta excedida: ${safeCategory}`
      : isHighRisk
      ? `Meta en riesgo alto: ${safeCategory}`
      : `Meta en riesgo: ${safeCategory}`,
    message: isExceeded
      ? `Gastaste ${formatCurrency(safeSpent)} de ${formatCurrency(safeLimit)} en ${safeCategory}.`
      : `${safeCategory} ya va en ${progress.toFixed(1)}% de su meta mensual.`,
    recommendation: isExceeded
      ? `Revisa los gastos de ${safeCategory}. Para volver al limite necesitas reducir ${formatCurrency(Math.abs(remaining))} o ajustar tu meta mensual.`
      : `Te quedan ${formatCurrency(Math.max(0, remaining))} para el resto del mes. Intenta mantener los proximos gastos de ${safeCategory} por debajo de ese monto.`,
    actionPath: `/transactions?category=${encodeURIComponent(safeCategory)}`,
    severity: isExceeded ? "danger" : "warning",
    sourceKey: `budget-${safeMonthKey}-${safeCategory}-${milestone}`,
    monthKey: safeMonthKey,
    reactivate,
  };
}
