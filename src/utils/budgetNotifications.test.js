import { describe, expect, it } from "vitest";
import { buildBudgetAlertNotification, getBudgetAlertMilestone } from "./budgetNotifications";

const notificationSettings = {
  budget80Enabled: true,
  budget100Enabled: true,
};

describe("budgetNotifications", () => {
  it("detecta hitos de presupuesto", () => {
    expect(getBudgetAlertMilestone(79.9)).toBeNull();
    expect(getBudgetAlertMilestone(80)).toBe("80");
    expect(getBudgetAlertMilestone(90)).toBe("90");
    expect(getBudgetAlertMilestone(100)).toBe("100");
  });

  it("crea alerta de riesgo alto al llegar al 90%", () => {
    const notification = buildBudgetAlertNotification({
      category: "Pasajes",
      spent: 90,
      limit: 100,
      monthKey: "2026-06",
      notificationSettings,
    });

    expect(notification).toMatchObject({
      type: "budget_warning",
      severity: "warning",
      sourceKey: "budget-2026-06-Pasajes-90",
      monthKey: "2026-06",
    });
  });

  it("reactiva alertas cuando viene de un gasto nuevo", () => {
    const notification = buildBudgetAlertNotification({
      category: "Gasolina",
      spent: 120,
      limit: 100,
      monthKey: "2026-06",
      notificationSettings,
      reactivate: true,
    });

    expect(notification).toMatchObject({
      type: "budget_limit",
      severity: "danger",
      sourceKey: "budget-2026-06-Gasolina-100",
      reactivate: true,
    });
  });
});
