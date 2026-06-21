import { describe, expect, it } from "vitest";
import { isFirestoreIndexError, sanitizeTransactionInput } from "./transactionService";

describe("transactionService", () => {
  it("normalizes object-based category and account values", () => {
    const value = sanitizeTransactionInput(
      {
        type: "income",
        category: { name: "  Sueldo  " },
        account: { name: "  Banco principal " },
        amount: "1500.50",
        date: "2026-06-19T08:00:00.000Z",
        createdAt: "2026-06-19T08:00:00.000Z",
        notes: "  Deposito mensual  ",
      },
      "user-1"
    );

    expect(value).toMatchObject({
      uid: "user-1",
      type: "Ingreso",
      category: "Sueldo",
      account: "Banco principal",
      amount: 1500.5,
      notes: "Deposito mensual",
    });
  });

  it("returns null when required fields are missing", () => {
    expect(
      sanitizeTransactionInput(
        {
          type: "expense",
          category: "",
          account: "Efectivo",
          amount: 20,
        },
        "user-1"
      )
    ).toBeNull();

    expect(
      sanitizeTransactionInput(
        {
          type: "expense",
          category: "Comida",
          account: "",
          amount: 20,
        },
        "user-1"
      )
    ).toBeNull();
  });

  it("falls back to normalized defaults for type and notes", () => {
    const value = sanitizeTransactionInput(
      {
        type: "otro",
        category: "Comida",
        account: "Efectivo",
        amount: 80,
        notes: null,
      },
      "user-1"
    );

    expect(value.type).toBe("Gasto");
    expect(value.notes).toBe("");
    expect(typeof value.date).toBe("string");
    expect(typeof value.createdAt).toBe("string");
  });

  it("detects missing Firestore index errors", () => {
    expect(
      isFirestoreIndexError({
        code: "failed-precondition",
        message: "The query requires an index.",
      })
    ).toBe(true);

    expect(
      isFirestoreIndexError({
        code: "permission-denied",
        message: "Missing or insufficient permissions.",
      })
    ).toBe(false);
  });
});
