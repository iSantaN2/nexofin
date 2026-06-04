import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  formatSignedCurrency,
  getDayKey,
  getMonthKey,
  getMonthProgress,
  getPreviousMonthKey,
  toDate,
} from "./formatters";

describe("formatters", () => {
  it("formatea moneda peruana de forma consistente", () => {
    expect(formatCurrency(12)).toBe("S/ 12.00");
    expect(formatCurrency("12.345")).toBe("S/ 12.35");
    expect(formatSignedCurrency(25, { income: true })).toBe("+ S/ 25.00");
    expect(formatSignedCurrency(25, { income: false, compact: true })).toBe("-S/ 25.00");
  });

  it("obtiene claves de mes y dia en zona horaria de Lima", () => {
    const value = "2026-06-04T13:00:00.000Z";

    expect(getMonthKey(value)).toBe("2026-06");
    expect(getDayKey(value)).toBe("2026-06-04");
    expect(getPreviousMonthKey("2026-01")).toBe("2025-12");
  });

  it("normaliza fechas de Firestore y valores invalidos", () => {
    expect(toDate({ seconds: 1780578000 })).toBeInstanceOf(Date);
    expect(toDate("fecha mala")).toBeNull();
  });

  it("formatea fecha legible", () => {
    expect(formatDate("2026-06-04T13:00:00.000Z")).toContain("2026");
    expect(formatMonthLabel("2026-06")).toContain("2026");
    expect(getMonthProgress("2026-06").daysInMonth).toBe(30);
  });
});
