import { toDate } from "./formatters";

export function isIncomeTransaction(type) {
  return type === "Ingreso" || type === "income";
}

function toTransactionDate(value) {
  return toDate(value);
}

function normalizeSearchText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseStartDate(dateString) {
  if (!dateString) return null;
  const parsed = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndDate(dateString) {
  if (!dateString) return null;
  const parsed = new Date(`${dateString}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function filterTransactions(
  transactions = [],
  {
    startDate = "",
    endDate = "",
    typeFilter = "all",
    methodFilter = "all",
    categoryFilter = "all",
    searchQuery = "",
  } = {}
) {
  const start = parseStartDate(startDate);
  const end = parseEndDate(endDate);
  const query = normalizeSearchText(searchQuery);

  return transactions.filter((item) => {
    const txDate = toTransactionDate(item.date);
    if (!txDate || Number.isNaN(txDate.getTime())) return false;

    const matchStart = start ? txDate >= start : true;
    const matchEnd = end ? txDate <= end : true;
    const matchType =
      typeFilter === "all" ||
      (typeFilter === "income" && isIncomeTransaction(item.type)) ||
      (typeFilter === "expense" && !isIncomeTransaction(item.type));
    const matchMethod = methodFilter === "all" || item.account === methodFilter;
    const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
    const haystack = normalizeSearchText(
      `${item.category || ""} ${item.account || ""} ${item.notes || ""} ${item.type || ""} ${
        item.amount || ""
      }`
    );
    const matchQuery = query ? haystack.includes(query) : true;

    return matchStart && matchEnd && matchType && matchMethod && matchCategory && matchQuery;
  });
}

export function sortTransactions(transactions = [], sortBy = "newest") {
  return transactions.slice().sort((a, b) => {
    const dateA = toTransactionDate(a.createdAt || a.date) || new Date(0);
    const dateB = toTransactionDate(b.createdAt || b.date) || new Date(0);
    const amountA = Number(a.amount) || 0;
    const amountB = Number(b.amount) || 0;

    if (sortBy === "oldest") return dateA - dateB;
    if (sortBy === "amount_desc") return amountB - amountA;
    if (sortBy === "amount_asc") return amountA - amountB;
    return dateB - dateA;
  });
}

export function calculateTransactionTotals(transactions = []) {
  return transactions.reduce(
    (totals, item) => {
      const value = Number(item.amount) || 0;
      if (isIncomeTransaction(item.type)) {
        totals.ingresos += value;
      } else {
        totals.gastos += value;
      }
      totals.balance = totals.ingresos - totals.gastos;
      return totals;
    },
    { ingresos: 0, gastos: 0, balance: 0 }
  );
}
