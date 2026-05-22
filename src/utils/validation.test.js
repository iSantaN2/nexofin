import { describe, expect, it } from "vitest";
import {
  isValidMonthKey,
  normalizeCategoryType,
  normalizeIsoDate,
  normalizeOptionalText,
  normalizePositiveAmount,
  normalizeText,
  normalizeType,
} from "./validation";

describe("validation utils", () => {
  it("normalizeText trims and limits length", () => {
    expect(normalizeText("   hola    mundo   ")).toBe("hola mundo");
    expect(normalizeText("abcdef", 3)).toBe("abc");
  });

  it("normalizeOptionalText returns empty string for undefined", () => {
    expect(normalizeOptionalText(undefined)).toBe("");
  });

  it("normalizeType supports ingreso and income", () => {
    expect(normalizeType("Ingreso")).toBe("Ingreso");
    expect(normalizeType("income")).toBe("Ingreso");
    expect(normalizeType("gasto")).toBe("Gasto");
  });

  it("normalizeCategoryType only allows ingreso|gasto", () => {
    expect(normalizeCategoryType("ingreso")).toBe("ingreso");
    expect(normalizeCategoryType("otro")).toBe("gasto");
  });

  it("normalizePositiveAmount returns 0 for invalid values", () => {
    expect(normalizePositiveAmount("")).toBe(0);
    expect(normalizePositiveAmount("abc")).toBe(0);
    expect(normalizePositiveAmount(0)).toBe(0);
    expect(normalizePositiveAmount(-20)).toBe(0);
  });

  it("normalizePositiveAmount rounds to 2 decimals", () => {
    expect(normalizePositiveAmount(10.555)).toBe(10.55);
    expect(normalizePositiveAmount("12.349")).toBe(12.35);
  });

  it("normalizeIsoDate returns fallback for invalid date", () => {
    const fallback = new Date("2026-01-01T00:00:00.000Z");
    expect(normalizeIsoDate("fecha-invalida", fallback)).toBe(
      "2026-01-01T00:00:00.000Z"
    );
  });

  it("normalizeIsoDate returns valid ISO date", () => {
    expect(normalizeIsoDate("2026-05-22T10:30:00.000Z")).toBe(
      "2026-05-22T10:30:00.000Z"
    );
  });

  it("isValidMonthKey validates YYYY-MM", () => {
    expect(isValidMonthKey("2026-05")).toBe(true);
    expect(isValidMonthKey("26-05")).toBe(false);
    expect(isValidMonthKey("2026-5")).toBe(false);
  });
});
