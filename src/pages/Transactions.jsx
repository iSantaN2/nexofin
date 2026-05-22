import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import AddTransactionModal from "../components/AddTransactionModal";
import { useTransactions } from "../context/TransactionsContext";

const APP_TIME_ZONE = "America/Lima";
const ITEMS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Mas reciente" },
  { value: "oldest", label: "Mas antiguo" },
  { value: "amount_desc", label: "Mayor monto" },
  { value: "amount_asc", label: "Menor monto" },
];

const categoryIcons = {
  comida: "🍕",
  supermercado: "🛒",
  transporte: "🚗",
  gasolina: "⛽",
  entretenimiento: "🎮",
  salario: "💵",
  educacion: "🎓",
  salud: "💊",
  hogar: "🏠",
  compras: "🛍️",
  viajes: "✈️",
  otros: "💡",
};

function toDate(value) {
  if (!value) return null;
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

function isIncome(type) {
  return type === "Ingreso" || type === "income";
}

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatDatePE(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

function formatTimePE(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

function getCategoryIcon(category = "") {
  const key = normalizeText(category);
  return categoryIcons[key] || "💡";
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

export default function Transactions() {
  const { transactions, deleteTransaction, updateTransaction } = useTransactions();

  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Mas reciente";

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        transactions
          .map((item) => item.category)
          .filter((value) => typeof value === "string" && value.trim())
      ),
    ].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    return ["all", ...uniqueCategories];
  }, [transactions]);

  const methods = useMemo(() => {
    const uniqueMethods = [
      ...new Set(
        transactions
          .map((item) => item.account)
          .filter((value) => typeof value === "string" && value.trim())
      ),
    ].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    return ["all", ...uniqueMethods];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const start = parseStartDate(startDate);
    const end = parseEndDate(endDate);
    const query = normalizeText(searchQuery);

    return transactions.filter((item) => {
      const txDate = toDate(item.date);
      if (!txDate || Number.isNaN(txDate.getTime())) return false;

      const matchStart = start ? txDate >= start : true;
      const matchEnd = end ? txDate <= end : true;

      const matchType =
        typeFilter === "all" ||
        (typeFilter === "income" && isIncome(item.type)) ||
        (typeFilter === "expense" && !isIncome(item.type));

      const matchMethod = methodFilter === "all" || item.account === methodFilter;
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;

      const haystack = normalizeText(
        `${item.category || ""} ${item.account || ""} ${item.notes || ""} ${item.type || ""} ${
          item.amount || ""
        }`
      );
      const matchQuery = query ? haystack.includes(query) : true;

      return matchStart && matchEnd && matchType && matchMethod && matchCategory && matchQuery;
    });
  }, [transactions, startDate, endDate, typeFilter, methodFilter, categoryFilter, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return filteredTransactions.slice().sort((a, b) => {
      const dateA = toDate(a.createdAt || a.date) || new Date(0);
      const dateB = toDate(b.createdAt || b.date) || new Date(0);
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;

      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "amount_desc") return amountB - amountA;
      if (sortBy === "amount_asc") return amountA - amountB;
      return dateB - dateA;
    });
  }, [filteredTransactions, sortBy]);

  const totals = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;

    filteredTransactions.forEach((item) => {
      const value = Number(item.amount) || 0;
      if (isIncome(item.type)) ingresos += value;
      else gastos += value;
    });

    return { ingresos, gastos, balance: ingresos - gastos };
  }, [filteredTransactions]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE));
  const currentTransactions = sortedTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (searchQuery.trim()) {
      chips.push({ key: "search", label: `Buscar: "${searchQuery.trim()}"` });
    }
    if (typeFilter !== "all") {
      chips.push({ key: "type", label: `Tipo: ${typeFilter === "income" ? "Ingresos" : "Gastos"}` });
    }
    if (categoryFilter !== "all") {
      chips.push({ key: "category", label: `Categoria: ${categoryFilter}` });
    }
    if (methodFilter !== "all") {
      chips.push({ key: "method", label: `Metodo: ${methodFilter}` });
    }
    if (startDate) {
      chips.push({ key: "startDate", label: `Desde: ${startDate}` });
    }
    if (endDate) {
      chips.push({ key: "endDate", label: `Hasta: ${endDate}` });
    }
    if (sortBy !== "newest") {
      chips.push({ key: "sort", label: `Orden: ${sortLabel}` });
    }

    return chips;
  }, [searchQuery, typeFilter, categoryFilter, methodFilter, startDate, endDate, sortBy, sortLabel]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setMethodFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const clearSingleFilter = (filterKey) => {
    if (filterKey === "search") setSearchQuery("");
    if (filterKey === "type") setTypeFilter("all");
    if (filterKey === "category") setCategoryFilter("all");
    if (filterKey === "method") setMethodFilter("all");
    if (filterKey === "startDate") setStartDate("");
    if (filterKey === "endDate") setEndDate("");
    if (filterKey === "sort") setSortBy("newest");
    setCurrentPage(1);
  };

  const handleDeleteClick = (transaction) => {
    setConfirmTarget(transaction);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!confirmTarget?.id) return;

    await deleteTransaction(confirmTarget.id);
    setShowConfirm(false);
    setConfirmTarget(null);
    toast.success("Transaccion eliminada correctamente");
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <h1 className="text-2xl font-semibold">Transacciones</h1>

      <div className="bg-white shadow rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
        <div className="xl:col-span-2">
          <label className="block text-sm mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Categoria, metodo, nota o monto"
              className="border rounded-lg p-2 pl-9 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Orden</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "Todas" : category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Metodo</label>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {method === "all" ? "Todos" : method}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg p-2 w-full"
          />
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="xl:ml-auto bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg"
        >
          Limpiar filtros
        </button>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="bg-white shadow rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500 mr-1">Filtros activos:</p>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearSingleFilter(chip.key)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-[#e9f2ff] text-[#0a2b6e] hover:bg-[#d9ecff] transition"
                title={`Quitar filtro ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-[#0a2b6e] hover:text-[#1f67ff] underline"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-2xl p-6 flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <p className="text-green-600 font-semibold">Ingresos: S/ {totals.ingresos.toFixed(2)}</p>
          <p className="text-red-600 font-semibold">Gastos: S/ {totals.gastos.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Movimientos: {filteredTransactions.length}</p>
        </div>
        <h2
          className={`text-2xl font-bold ${
            totals.balance >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          Balance: S/ {totals.balance.toFixed(2)}
        </h2>
      </div>

      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Historial</h3>

        <AnimatePresence>
          {currentTransactions.length === 0 ? (
            <motion.p
              key="empty"
              className="text-gray-400 text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No hay transacciones para mostrar.
            </motion.p>
          ) : (
            <motion.ul
              key="list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentTransactions.map((transaction) => {
                const income = isIncome(transaction.type);
                return (
                  <motion.li
                    key={transaction.id}
                    className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {transaction.category || "Sin categoria"}
                        </p>
                        <p className="text-xs text-gray-500">{formatDatePE(transaction.date)}</p>
                        <p className="text-xs text-gray-400">
                          {formatTimePE(transaction.createdAt || transaction.date)} · {transaction.account}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className={`font-bold ${income ? "text-green-600" : "text-red-600"}`}>
                        {income ? "+ S/" : "- S/"} {Number(transaction.amount).toFixed(2)}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          className="text-[#1f67ff] hover:text-[#0a2b6e] p-1 rounded-md transition"
                          title="Editar transaccion"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
                          title="Eliminar transaccion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg text-sm ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e9f2ff] text-[#0a2b6e] hover:bg-[#d9ecff]"
              }`}
            >
              {"<"} Anterior
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentPage === index + 1
                    ? "bg-[#0a2b6e] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg text-sm ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#e9f2ff] text-[#0a2b6e] hover:bg-[#d9ecff]"
              }`}
            >
              Siguiente {">"}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        show={showConfirm}
        title="Eliminar transaccion"
        message={`¿Seguro que deseas eliminar "${confirmTarget?.category}" por S/ ${confirmTarget?.amount}?`}
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setConfirmTarget(null);
        }}
      />

      {editingTransaction && (
        <AddTransactionModal
          show
          initialData={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onAdd={updateTransaction}
        />
      )}
    </div>
  );
}
