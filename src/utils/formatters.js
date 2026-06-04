export const APP_TIME_ZONE = "America/Lima";

const MONTH_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

const DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toDate(value) {
  if (!value) return null;
  if (value?.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCurrency(value, { withSymbol = true } = {}) {
  const amount = Number(value) || 0;
  const formatted = amount.toFixed(2);
  return withSymbol ? `S/ ${formatted}` : formatted;
}

export function formatSignedCurrency(value, { income = false, compact = false } = {}) {
  const sign = income ? "+" : "-";
  const amount = Math.abs(Number(value) || 0).toFixed(2);
  return compact ? `${sign}S/ ${amount}` : `${sign} S/ ${amount}`;
}

export function getMonthKey(value = new Date()) {
  const date = toDate(value);
  if (!date) return "";

  const parts = MONTH_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : "";
}

export function getCurrentMonthKey() {
  return getMonthKey(new Date());
}

export function getPreviousMonthKey(monthKey) {
  if (!monthKey) return "";
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return "";

  const previous = new Date(year, month - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

export function getDayKey(value = new Date()) {
  const date = toDate(value);
  return date ? DAY_KEY_FORMATTER.format(date) : "";
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return "";
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return "";

  const monthDate = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(monthDate);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getMonthProgress(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  const now = new Date();

  if (!year || !month) {
    return {
      currentDay: now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  return {
    currentDay: isCurrentMonth ? now.getDate() : daysInMonth,
    daysInMonth,
  };
}

export function formatDate(value, options = {}) {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatTime(value, options = {}) {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}
