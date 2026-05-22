export function normalizeText(value, maxLen = 80) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLen);
}

export function normalizeOptionalText(value, maxLen = 500) {
  return normalizeText(value, maxLen);
}

export function normalizeType(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized === "ingreso" || normalized === "income" ? "Ingreso" : "Gasto";
}

export function normalizeCategoryType(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized === "ingreso" ? "ingreso" : "gasto";
}

export function normalizePositiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  if (amount <= 0) return 0;
  return Number(amount.toFixed(2));
}

export function normalizeIsoDate(value, fallback = new Date()) {
  const parsed = value ? new Date(value) : fallback;
  if (Number.isNaN(parsed.getTime())) return fallback.toISOString();
  return parsed.toISOString();
}

export function isValidMonthKey(value) {
  return /^[0-9]{4}-[0-9]{2}$/.test(String(value || ""));
}
