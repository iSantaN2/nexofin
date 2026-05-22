import { describe, expect, it } from "vitest";
import {
  calculateComparison,
  calculateTotals,
  getBudgetStatus,
  getPrimaryMetricValue,
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
});
