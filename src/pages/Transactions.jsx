import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Search, Trash2, X } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import AddTransactionModal from "../components/AddTransactionModal";
import { useTransactions } from "../context/TransactionsContext";
import { usePaginatedTransactions } from "../hooks/usePaginatedTransactions";
import CategoryIcon from "../components/CategoryIcon";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageHero from "../components/ui/PageHero";
import SectionPanel from "../components/ui/SectionPanel";
import {
  calculateTransactionTotals,
  filterTransactions,
  isIncomeTransaction,
  sortTransactions,
} from "../utils/transactions";
import { formatCurrency, formatDate, formatSignedCurrency, formatTime } from "../utils/formatters";
const ITEMS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: "newest", label: "Más reciente" },
  { value: "oldest", label: "Más antiguo" },
  { value: "amount_desc", label: "Mayor monto" },
  { value: "amount_asc", label: "Menor monto" },
];

export default function Transactions() {
  const { transactions, deleteTransaction, updateTransaction } = useTransactions();
  const [searchParams] = useSearchParams();

  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isUsingRemoteFeed =
    typeFilter === "all" &&
    !startDate &&
    !endDate &&
    methodFilter === "all" &&
    categoryFilter === "all" &&
    !deferredSearchQuery.trim() &&
    sortBy === "newest";

  const {
    paginatedTransactions,
    paginatedTransactionsError,
    paginatedTransactionsLoading,
    loadingMorePaginatedTransactions,
    hasMorePaginatedTransactions,
    loadMorePaginatedTransactions,
  } = usePaginatedTransactions({
    enabled: isUsingRemoteFeed,
    refreshKey: transactions.length,
  });

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Más reciente";

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
    return filterTransactions(transactions, {
      startDate,
      endDate,
      typeFilter,
      methodFilter,
      categoryFilter,
      searchQuery: deferredSearchQuery,
    });
  }, [
    transactions,
    startDate,
    endDate,
    typeFilter,
    methodFilter,
    categoryFilter,
    deferredSearchQuery,
  ]);

  const sortedTransactions = useMemo(() => {
    if (isUsingRemoteFeed) {
      return paginatedTransactions;
    }

    return sortTransactions(filteredTransactions, sortBy);
  }, [filteredTransactions, isUsingRemoteFeed, paginatedTransactions, sortBy]);

  const totals = useMemo(
    () => calculateTransactionTotals(filteredTransactions),
    [filteredTransactions]
  );

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE));
  const currentTransactions = isUsingRemoteFeed
    ? sortedTransactions
    : sortedTransactions.slice(
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
      chips.push({ key: "category", label: `Categoría: ${categoryFilter}` });
    }
    if (methodFilter !== "all") {
      chips.push({ key: "method", label: `Método: ${methodFilter}` });
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
    if (isUsingRemoteFeed) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, isUsingRemoteFeed, totalPages]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (!categoryFromUrl) return;
    if (!categories.includes(categoryFromUrl)) return;

    setCategoryFilter(categoryFromUrl);
    setTypeFilter("expense");
    setCurrentPage(1);
  }, [categories, searchParams]);

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
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHero
        eyebrow="Operaciones"
        title="Transacciones"
        description="Consulta, filtra y ajusta tus movimientos con una vista mas clara de entradas, salidas y balance."
        stats={[
          {
            label: "Movimientos",
            value: `${filteredTransactions.length}`,
          },
          {
            label: "Ingresos",
            value: formatCurrency(totals.ingresos),
            tone: "success",
          },
          {
            label: "Gastos",
            value: formatCurrency(totals.gastos),
            tone: "danger",
          },
          {
            label: "Balance",
            value: formatCurrency(totals.balance),
            tone: totals.balance >= 0 ? "success" : "danger",
          },
        ]}
        actions={
          activeFilterChips.length > 0 ? (
            <Button
              type="button"
              onClick={resetFilters}
              variant="soft"
            >
              Limpiar filtros
            </Button>
          ) : null
        }
      />

      <SectionPanel className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-500">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Categoría, método, nota o monto"
              className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 pl-9 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Orden</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Categoría</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "Todas" : category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Método</label>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {method === "all" ? "Todos" : method}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-500">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#dbe8ff] bg-white p-2 text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          />
        </div>

        <Button
          type="button"
          onClick={resetFilters}
          variant="soft"
          className="xl:ml-auto"
        >
          Limpiar filtros
        </Button>
      </SectionPanel>

      {activeFilterChips.length > 0 && (
        <SectionPanel>
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-sm text-slate-500">Filtros activos:</p>
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
        </SectionPanel>
      )}

      <SectionPanel className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-green-600 font-semibold">Ingresos: {formatCurrency(totals.ingresos)}</p>
          <p className="text-red-600 font-semibold">Gastos: {formatCurrency(totals.gastos)}</p>
          <p className="mt-1 text-xs text-slate-500">Movimientos: {filteredTransactions.length}</p>
        </div>
        <h2
          className={`text-2xl font-bold ${
            totals.balance >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          Balance: {formatCurrency(totals.balance)}
        </h2>
      </SectionPanel>

      <SectionPanel title="Historial">
        {isUsingRemoteFeed && paginatedTransactionsError ? (
          <p className="mb-4 text-sm font-medium text-red-600">{paginatedTransactionsError}</p>
        ) : null}
        <AnimatePresence>
          {currentTransactions.length === 0 && !paginatedTransactionsLoading ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                title={
                  activeFilterChips.length > 0
                    ? "No encontramos movimientos con esos filtros."
                    : "Aún no hay transacciones registradas."
                }
                description={
                  activeFilterChips.length > 0
                    ? "Prueba limpiar filtros o ampliar el rango de fechas para revisar más movimientos."
                    : "Cuando agregues ingresos o gastos, aparecerán aquí con su categoría, método y fecha."
                }
                action={
                  activeFilterChips.length > 0 ? (
                    <Button
                      type="button"
                      onClick={resetFilters}
                      variant="brand"
                    >
                      Limpiar filtros
                    </Button>
                  ) : null
                }
              />
            </motion.div>
          ) : paginatedTransactionsLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="py-10 text-center text-sm text-gray-500">Cargando historial reciente...</p>
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentTransactions.map((transaction) => {
                const income = isIncomeTransaction(transaction.type);
                return (
                  <motion.li
                    key={transaction.id}
                    className="bg-gray-50 rounded-lg border border-gray-100 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={transaction.category} type={transaction.type} />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {transaction.category || "Sin categoría"}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        <p className="text-xs text-gray-400">
                          {formatTime(transaction.createdAt || transaction.date)} · {transaction.account}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className={`font-bold ${income ? "text-green-600" : "text-red-600"}`}>
                        {formatSignedCurrency(transaction.amount, { income })}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          className="text-[#1f67ff] hover:text-[#0a2b6e] p-1 rounded-md transition"
                          title="Editar transacción"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
                          title="Eliminar transacción"
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

        {!isUsingRemoteFeed && totalPages > 1 && (
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
                    : "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]"
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

        {isUsingRemoteFeed && hasMorePaginatedTransactions ? (
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={loadMorePaginatedTransactions}
              disabled={loadingMorePaginatedTransactions}
              variant="soft"
            >
              {loadingMorePaginatedTransactions ? "Cargando mas movimientos..." : "Cargar mas"}
            </Button>
          </div>
        ) : null}
      </SectionPanel>

      <ConfirmModal
        show={showConfirm}
        title="Eliminar transacción"
        message={`¿Seguro que deseas eliminar "${confirmTarget?.category}" por ${formatCurrency(confirmTarget?.amount)}?`}
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

