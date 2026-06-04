import { describe, expect, it } from "vitest";
import {
  calculateTransactionTotals,
  filterTransactions,
  sortTransactions,
} from "./transactions";

const transactions = [
  {
    id: "1",
    type: "Gasto",
    category: "Gasolina",
    account: "Tarjeta",
    amount: 120,
    date: "2026-06-01T10:00:00.000Z",
    createdAt: "2026-06-01T10:10:00.000Z",
    notes: "Auto familiar",
  },
  {
    id: "2",
    type: "Ingreso",
    category: "Salario",
    account: "Banco",
    amount: 2500,
    date: "2026-06-02T10:00:00.000Z",
    createdAt: "2026-06-02T10:10:00.000Z",
    notes: "Pago mensual",
  },
  {
    id: "3",
    type: "Gasto",
    category: "Comida",
    account: "Efectivo",
    amount: 45.5,
    date: "2026-05-28T10:00:00.000Z",
    createdAt: "2026-05-28T10:10:00.000Z",
    notes: "Menú del dia",
  },
];

describe("transactions utils", () => {
  it("filters by type, category, method and date range", () => {
    const result = filterTransactions(transactions, {
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      typeFilter: "expense",
      methodFilter: "Tarjeta",
      categoryFilter: "Gasolina",
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters search text ignoring accents and case", () => {
    const result = filterTransactions(transactions, {
      searchQuery: "MENU",
    });

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Comida");
  });

  it("sorts transactions by amount and date", () => {
    expect(sortTransactions(transactions, "amount_desc").map((item) => item.id)).toEqual([
      "2",
      "1",
      "3",
    ]);
    expect(sortTransactions(transactions, "oldest").map((item) => item.id)).toEqual([
      "3",
      "1",
      "2",
    ]);
  });

  it("calculates totals for filtered transactions", () => {
    const result = calculateTransactionTotals(transactions);

    expect(result.ingresos).toBe(2500);
    expect(result.gastos).toBe(165.5);
    expect(result.balance).toBe(2334.5);
  });
});
