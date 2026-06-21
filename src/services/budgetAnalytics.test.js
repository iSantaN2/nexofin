import { describe, expect, it } from "vitest";
import {
  buildBudgetCards,
  getBudgetMonthTotals,
  getBudgetSpentByCategory,
  getBudgetSummary,
  getBudgetViewStatus,
} from "./budgetAnalytics";

describe("budgetAnalytics", () => {
  it("groups only expenses by category", () => {
    const totals = getBudgetSpentByCategory([
      { type: "Ingreso", amount: 1000, category: "Salario" },
      { type: "Gasto", amount: 80, category: "Comida" },
      { type: "expense", amount: 20, category: "Comida" },
    ]);

    expect(totals).toEqual({ Comida: 100 });
  });

  it("builds ordered budget cards with status and projection", () => {
    const cards = buildBudgetCards({
      budgets: [
        { id: "b1", category: "Comida", limitAmount: 100 },
        { id: "b2", category: "Transporte", limitAmount: 200 },
      ],
      spentByCategory: { Comida: 120, Transporte: 100 },
      monthDays: { currentDay: 10, daysInMonth: 30 },
    });

    expect(cards[0]).toMatchObject({
      id: "b1",
      category: "Comida",
      progress: 120,
      remaining: -20,
      status: { key: "exceeded" },
    });
    expect(cards[1]).toMatchObject({
      id: "b2",
      status: { key: "healthy" },
      projectedExceeded: true,
      estimatedExceedDay: 20,
    });
  });

  it("summarizes budget cards and monthly totals", () => {
    const monthTotals = getBudgetMonthTotals([
      { type: "income", amount: 500 },
      { type: "expense", amount: 125 },
    ]);
    const cards = [
      { limit: 100, spent: 120, projectedSpend: 240, status: getBudgetViewStatus(120) },
      { limit: 200, spent: 80, projectedSpend: 160, status: getBudgetViewStatus(40) },
    ];

    const summary = getBudgetSummary({ budgetCards: cards, monthTotals });

    expect(summary.totalLimit).toBe(300);
    expect(summary.totalSpent).toBe(200);
    expect(summary.globalStatus).toBe("Riesgo alto");
    expect(summary.savings).toBe(375);
    expect(summary.savingsRate).toBe(75);
  });
});
