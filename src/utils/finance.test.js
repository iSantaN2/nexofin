import { describe, expect, it } from "vitest";
import {
  calculateComparison,
  calculateTotals,
  buildFinancialRecommendation,
  buildMonthlyInsight,
  getCriticalBudget,
  getCriticalBudgetProjection,
  getBudgetStatus,
  getBudgetProjection,
  getPrimaryMetricValue,
  getSavingsRate,
  getTopExpenseCategory,
  getUnusualExpenseCategories,
  isIncomeTransaction,
  matchesTypeFilter,
} from "./finance";

describe("finance utils", () => {
  it("detects income transaction types", () => {
    expect(isIncomeTransaction({ type: "Ingreso" })).toBe(true);
    expect(isIncomeTransaction({ type: "income" })).toBe(true);
    expect(isIncomeTransaction({ type: "Gasto" })).toBe(false);
  });

  it("matches type filter correctly", () => {
    const income = { type: "Ingreso" };
    const expense = { type: "Gasto" };

    expect(matchesTypeFilter(income, "all")).toBe(true);
    expect(matchesTypeFilter(expense, "all")).toBe(true);
    expect(matchesTypeFilter(income, "income")).toBe(true);
    expect(matchesTypeFilter(expense, "income")).toBe(false);
    expect(matchesTypeFilter(income, "expense")).toBe(false);
    expect(matchesTypeFilter(expense, "expense")).toBe(true);
  });

  it("calculates totals and balance", () => {
    const items = [
      { type: "Ingreso", amount: 1000 },
      { type: "income", amount: 500 },
      { type: "Gasto", amount: 250.5 },
      { type: "Gasto", amount: 49.5 },
    ];

    const totals = calculateTotals(items);
    expect(totals.ingresos).toBe(1500);
    expect(totals.gastos).toBe(300);
    expect(totals.balance).toBe(1200);
  });

  it("returns primary metric value by filter", () => {
    const totals = { ingresos: 100, gastos: 40, balance: 60 };
    expect(getPrimaryMetricValue(totals, "income")).toBe(100);
    expect(getPrimaryMetricValue(totals, "expense")).toBe(40);
    expect(getPrimaryMetricValue(totals, "all")).toBe(60);
  });

  it("calculates period comparison with percentage", () => {
    const current = { ingresos: 1200, gastos: 200, balance: 1000 };
    const previous = { ingresos: 1000, gastos: 300, balance: 700 };
    const result = calculateComparison(current, previous, "all", true);

    expect(result.difference).toBe(300);
    expect(result.percentChange).toBeCloseTo(42.8571, 4);
    expect(result.hasPreviousData).toBe(true);
  });

  it("returns null percentage when previous value is zero", () => {
    const current = { ingresos: 200, gastos: 0, balance: 200 };
    const previous = { ingresos: 0, gastos: 0, balance: 0 };
    const result = calculateComparison(current, previous, "income", true);

    expect(result.difference).toBe(200);
    expect(result.percentChange).toBeNull();
  });

  it("returns proper budget health states", () => {
    expect(getBudgetStatus(20).label).toBe("Saludable");
    expect(getBudgetStatus(80).label).toBe("En riesgo");
    expect(getBudgetStatus(120).label).toBe("Excedido");
  });

  it("finds the top expense category", () => {
    const result = getTopExpenseCategory([
      { type: "Gasto", category: "Comida", amount: 50 },
      { type: "Ingreso", category: "Salario", amount: 500 },
      { type: "Gasto", category: "Comida", amount: 25 },
      { type: "Gasto", category: "Transporte", amount: 40 },
    ]);

    expect(result).toEqual({ category: "Comida", amount: 75 });
  });

  it("finds the most critical budget", () => {
    const result = getCriticalBudget([
      { category: "Comida", limit: 500, progress: 20 },
      { category: "Transporte", limit: 100, progress: 95 },
    ]);

    expect(result.category).toBe("Transporte");
  });

  it("calculates savings rate", () => {
    expect(getSavingsRate({ ingresos: 1000, balance: 250 })).toBe(25);
    expect(getSavingsRate({ ingresos: 0, balance: 250 })).toBeNull();
  });

  it("builds monthly insight and recommendation", () => {
    const criticalBudget = { category: "Pasajes", progress: 105 };
    const insight = buildMonthlyInsight({
      totals: { balance: 100 },
      previousTotals: { balance: 50 },
      hasPreviousData: true,
      criticalBudget,
    });
    const recommendation = buildFinancialRecommendation({
      totals: { ingresos: 1000, balance: 200 },
      criticalBudget,
    });

    expect(insight).toContain("Pasajes");
    expect(recommendation).toContain("Pasajes");
  });

  it("detects unusual expense increases by category", () => {
    const result = getUnusualExpenseCategories(
      [
        { type: "Gasto", category: "Gasolina", amount: 160 },
        { type: "Gasto", category: "Comida", amount: 55 },
      ],
      [
        { type: "Gasto", category: "Gasolina", amount: 100 },
        { type: "Gasto", category: "Comida", amount: 50 },
      ]
    );

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Gasolina");
    expect(result[0].increasePercent).toBe(60);
  });

  it("detects new expense categories above minimum amount", () => {
    const result = getUnusualExpenseCategories(
      [{ type: "Gasto", category: "Viajes", amount: 120 }],
      []
    );

    expect(result[0].category).toBe("Viajes");
    expect(result[0].isNewExpense).toBe(true);
  });

  it("projects budget overspending", () => {
    const result = getBudgetProjection(
      { category: "Pasajes", spent: 150, limit: 200 },
      { currentDay: 15, daysInMonth: 30 }
    );

    expect(result.projectedSpend).toBe(300);
    expect(result.projectedExceeded).toBe(true);
    expect(result.estimatedExceedDay).toBe(20);
  });

  it("finds the most critical projected budget", () => {
    const result = getCriticalBudgetProjection(
      [
        { category: "Comida", spent: 100, limit: 500 },
        { category: "Gasolina", spent: 300, limit: 400 },
      ],
      { currentDay: 15, daysInMonth: 30 }
    );

    expect(result.category).toBe("Gasolina");
    expect(result.projectedExceeded).toBe(true);
  });
});
