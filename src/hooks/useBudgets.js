import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useBudgets() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useBudgets debe usarse dentro de AppProvider");
  }

  return {
    budgets: context.budgets,
    budgetsError: context.budgetsError,
    loading: context.loading,
    upsertBudget: context.upsertBudget,
    deleteBudget: context.deleteBudget,
    notificationSettings: context.notificationSettings,
    createNotification: context.createNotification,
  };
}
