import { describe, expect, it } from "vitest";
import {
  buildDashboardModel,
  getBudgetStatusItems,
  getCategoryDistributionData,
  getFilteredMonthTransactions,
} from "./dashboardAnalytics";

describe("dashboardAnalytics", () => {
  it("filters month transactions by type and sorts by recency", () => {
    const items = [
      { id: "1", type: "Gasto", amount: 10, date: "2026-06-10", createdAt: "2026-06-10T08:00:00" },
      { id: "2", type: "Ingreso", amount: 100, date: "2026-06-11", createdAt: "2026-06-11T08:00:00" },
      { id: "3", type: "Gasto", amount: 20, date: "2026-05-11", createdAt: "2026-05-11T08:00:00" },
    ];

    const result = getFilteredMonthTransactions(items, "2026-06", "income");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("builds budget status items and category distribution", () => {
    const budgetItems = getBudgetStatusItems({
      budgets: [{ id: "b1", category: "Comida", limitAmount: 100, monthKey: "2026-06" }],
      monthExpenseByCategory: { Comida: 120 },
      selectedMonth: "2026-06",
    });

    expect(budgetItems[0]).toMatchObject({
      category: "Comida",
      spent: 120,
      progress: 120,
      remaining: -20,
      status: { label: "Excedido" },
    });

    expect(
      getCategoryDistributionData([
        { category: "Comida", amount: 100 },
        { category: "Comida", amount: 50 },
        { category: "Transporte", amount: 20 },
      ])
    ).toEqual([
      { name: "Comida", value: 150 },
      { name: "Transporte", value: 20 },
    ]);
  });

  it("builds a dashboard model with insights and comparison", () => {
    const model = buildDashboardModel({
      transactions: [
        { id: "1", type: "Ingreso", amount: 1000, date: "2026-06-05", createdAt: "2026-06-05T08:00:00", category: "Salario" },
        { id: "2", type: "Gasto", amount: 300, date: "2026-06-07", createdAt: "2026-06-07T08:00:00", category: "Comida" },
        { id: "3", type: "Gasto", amount: 100, date: "2026-05-07", createdAt: "2026-05-07T08:00:00", category: "Comida" },
      ],
      budgets: [{ id: "b1", category: "Comida", limitAmount: 250, monthKey: "2026-06" }],
      selectedMonth: "2026-06",
      previousMonthKey: "2026-05",
      filter: "all",
    });

    expect(model.totals).toMatchObject({ ingresos: 1000, gastos: 300, balance: 700 });
    expect(model.monthComparison.hasPreviousData).toBe(true);
    expect(model.criticalBudget?.category).toBe("Comida");
    expect(model.topExpenseCategory).toMatchObject({ category: "Comida", amount: 300 });
    expect(model.data).toEqual(
      expect.arrayContaining([
        { name: "Salario", value: 1000 },
        { name: "Comida", value: 300 },
      ])
    );
  });
});
