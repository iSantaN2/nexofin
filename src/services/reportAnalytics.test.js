import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  buildPeriodBarData,
  buildReportInsights,
  buildTrendData,
  filterTransactionsByCategory,
  filterTransactionsByRange,
  getAverageTicket,
  getPeriodRange,
  getReportComparison,
  getReportHealth,
  getReportCategories,
  getTopExpenseCategories,
  normalizeReportTransactions,
} from "./reportAnalytics";

describe("reportAnalytics", () => {
  it("normalizes report transactions and categories", () => {
    const transactions = normalizeReportTransactions([
      {
        id: "1",
        type: "income",
        amount: "1500",
        category: { name: "Salario" },
        account: { name: "BBVA" },
        date: "2026-06-10",
      },
      {
        id: "2",
        type: "Gasto",
        amount: 40,
        category: "Comida",
        account: "Yape",
        date: "2026-06-11",
      },
    ]);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      type: "Ingreso",
      amount: 1500,
      category: "Salario",
      account: "BBVA",
    });
    expect(getReportCategories(transactions)).toEqual(["todos", "Salario", "Comida"]);
  });

  it("filters by period and category, and compares totals", () => {
    const base = normalizeReportTransactions([
      { id: "1", type: "Gasto", amount: 20, category: "Comida", account: "Caja", date: "2026-06-10" },
      { id: "2", type: "Gasto", amount: 40, category: "Comida", account: "Caja", date: "2026-06-12" },
      { id: "3", type: "Ingreso", amount: 100, category: "Salario", account: "Banco", date: "2026-05-30" },
    ]);
    const range = getPeriodRange("7days", dayjs("2026-06-12T12:00:00"));
    const current = filterTransactionsByCategory(filterTransactionsByRange(base, range), "Comida");

    expect(current).toHaveLength(2);

    const comparison = getReportComparison(
      { ingresos: 100, gastos: 60, balance: 40 },
      { ingresos: 80, gastos: 50, balance: 30 }
    );

    expect(comparison).toEqual({
      diffBalance: 10,
      diffIncome: 20,
      diffExpense: 10,
      pctBalance: expect.closeTo(33.3333333333),
    });
  });

  it("builds health, averages, rankings, trends and insights", () => {
    const transactions = normalizeReportTransactions([
      { id: "1", type: "Ingreso", amount: 1000, category: "Salario", account: "Banco", date: "2026-02-10" },
      { id: "2", type: "Gasto", amount: 120, category: "Comida", account: "Yape", date: "2026-06-10" },
      { id: "3", type: "Gasto", amount: 80, category: "Transporte", account: "Tarjeta", date: "2026-06-11" },
      { id: "4", type: "Gasto", amount: 50, category: "Comida", account: "Yape", date: "2026-05-15" },
    ]);

    expect(getAverageTicket(transactions, { ingresos: 1000, gastos: 250 })).toEqual({
      incomeAvg: 1000,
      expenseAvg: expect.closeTo(83.3333333333),
    });
    expect(getReportHealth({ ingresos: 1000, balance: 250 }).label).toBe("Saludable");
    expect(getTopExpenseCategories(transactions, 250)[0]).toMatchObject({
      name: "Comida",
      amount: 170,
    });
    expect(buildTrendData({ transactions, now: dayjs("2026-06-20") })).toHaveLength(6);
    expect(buildPeriodBarData({ rangeLabel: "Mes actual", totals: { ingresos: 1000, gastos: 250 } })).toEqual([
      { name: "Mes actual", ingresos: 1000, gastos: 250 },
    ]);
    expect(
      buildReportInsights({
        topExpenseCategories: [{ name: "Comida", amount: 170 }],
        previousTransactionsLength: 2,
        diffExpense: 40,
        methodsBreakdown: [{ name: "Yape", amount: 170 }],
      })
    ).toEqual([
      "Tu mayor gasto fue Comida con S/ 170.00.",
      "Gastaste S/ 40.00 mas que el periodo anterior.",
      "Tu metodo mas usado fue Yape.",
    ]);
  });
});
