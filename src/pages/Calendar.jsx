import React, { useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Plus, CalendarDays, CalendarRange, RefreshCw } from "lucide-react";
import { TransactionsContext } from "../context/TransactionsContext";
import AddTransactionModal from "../components/AddTransactionModal";
import CategoryIcon from "../components/CategoryIcon";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import PageHeader from "../components/ui/PageHeader";
import SectionPanel from "../components/ui/SectionPanel";
import { formatCurrency, formatSignedCurrency, formatTime, toDate } from "../utils/formatters";

const FILTER_OPTIONS = [
  { key: "all", label: "Todas" },
  { key: "income", label: "Ingresos" },
  { key: "expense", label: "Gastos" },
];

function normalizeCategory(category = "") {
  return String(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isIncome(type) {
  return type === "Ingreso" || type === "income";
}

function matchesTypeFilter(transaction, typeFilter) {
  if (typeFilter === "income") return isIncome(transaction.type);
  if (typeFilter === "expense") return !isIncome(transaction.type);
  return true;
}

export default function CalendarPage() {
  const { transactions, addTransaction } = useContext(TransactionsContext);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [weekDays, setWeekDays] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const normalizedTransactions = useMemo(
    () =>
      transactions
        .map((item) => {
          const parsedDate = toDate(item.date);
          if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;

          return {
            ...item,
            parsedDate,
            amount: Number(item.amount) || 0,
            type: isIncome(item.type) ? "Ingreso" : "Gasto",
            category: item.category || "Sin categoría",
          };
        })
        .filter(Boolean),
    [transactions]
  );

  const categories = useMemo(
    () => ["all", ...new Set(normalizedTransactions.map((item) => item.category))],
    [normalizedTransactions]
  );

  const getWeekDays = (date) => {
    const startOfWeek = dayjs(date).startOf("week").add(1, "day");
    return Array.from({ length: 7 }, (_, index) => startOfWeek.add(index, "day").toDate());
  };

  useEffect(() => {
    setWeekDays(getWeekDays(selectedDate));
  }, [selectedDate]);

  const selectedDayTransactions = useMemo(() => {
    const selectedDayKey = dayjs(selectedDate).format("YYYY-MM-DD");

    return normalizedTransactions
      .filter((item) => dayjs(item.parsedDate).format("YYYY-MM-DD") === selectedDayKey)
      .filter((item) => matchesTypeFilter(item, typeFilter))
      .filter((item) =>
        categoryFilter === "all"
          ? true
          : normalizeCategory(item.category) === normalizeCategory(categoryFilter)
      )
      .sort((a, b) => b.parsedDate - a.parsedDate);
  }, [selectedDate, normalizedTransactions, typeFilter, categoryFilter]);

  const weeklyExpenseData = useMemo(() => {
    const rows = weekDays.map((day) => {
      const amount = normalizedTransactions
        .filter((item) => dayjs(item.parsedDate).isSame(day, "day"))
        .filter((item) => !isIncome(item.type))
        .filter((item) =>
          categoryFilter === "all"
            ? true
            : normalizeCategory(item.category) === normalizeCategory(categoryFilter)
        )
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        key: dayjs(day).format("YYYY-MM-DD"),
        dayLabel: dayjs(day).format("dd"),
        amount,
      };
    });

    const max = rows.reduce((highest, row) => Math.max(highest, row.amount), 0);

    return rows.map((row) => ({
      ...row,
      percent: max > 0 ? (row.amount / max) * 100 : 0,
    }));
  }, [weekDays, normalizedTransactions, categoryFilter]);

  const daySummary = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;

    selectedDayTransactions.forEach((item) => {
      if (item.type === "Ingreso") ingresos += item.amount;
      else gastos += item.amount;
    });

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      count: selectedDayTransactions.length,
    };
  }, [selectedDayTransactions]);

  const transactionMarkers = useMemo(() => {
    const map = {};

    normalizedTransactions.forEach((item) => {
      const dateKey = dayjs(item.parsedDate).format("YYYY-MM-DD");
      if (!map[dateKey]) {
        map[dateKey] = { income: 0, expense: 0 };
      }
      if (item.type === "Ingreso") map[dateKey].income += 1;
      else map[dateKey].expense += 1;
    });

    return map;
  }, [normalizedTransactions]);

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const renderDateMarkers = (date) => {
    const key = dayjs(date).format("YYYY-MM-DD");
    const marker = transactionMarkers[key];
    if (!marker) return null;

    const hasIncome = marker.income > 0;
    const hasExpense = marker.expense > 0;

    return (
      <div className="flex justify-center items-center gap-1 mt-1">
        {hasIncome && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
        {hasExpense && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
        {!hasIncome && !hasExpense && <span className="w-1.5 h-1.5 bg-[#1f67ff] rounded-full" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      <PageHeader
        title="Calendario financiero"
        description="Revisa movimientos por día y detecta patrónes semanales."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Ingresos del día" value={formatCurrency(daySummary.ingresos)} color="green" />
        <MetricCard title="Gastos del día" value={formatCurrency(daySummary.gastos)} color="red" />
        <MetricCard
          title="Balance del día"
          value={formatCurrency(daySummary.balance)}
          color={daySummary.balance >= 0 ? "green" : "red"}
        />
        <MetricCard title="Movimientos" value={daySummary.count} color="slate" />
      </div>

      <div className="flex justify-between items-center w-full gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition ${
              viewMode === "month"
                ? "bg-[#0a2b6e] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Mensual
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition ${
              viewMode === "week"
                ? "bg-[#0a2b6e] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Semanal
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setTypeFilter(option.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                typeFilter === option.key
                  ? "bg-[#0a2b6e] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Todas las categorías" : item}
              </option>
            ))}
          </select>

          <Button
            onClick={goToToday}
            variant="soft"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            Hoy
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <SectionPanel>
          <div className="mx-auto w-full max-w-[420px] sm:max-w-[520px]">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="es-ES"
              tileContent={({ date }) => renderDateMarkers(date)}
              className="rounded-xl border-none w-full"
            />
          </div>
        </SectionPanel>
      ) : (
        <SectionPanel>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = dayjs(day).isSame(selectedDate, "day");
              const isToday = dayjs(day).isSame(dayjs(), "day");

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                    isSelected
                      ? "bg-[#0a2b6e] text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } ${isToday ? "ring-2 ring-[#69d8c4]" : ""}`}
                >
                  <span className="text-sm font-semibold">{dayjs(day).format("dd")}</span>
                  <span className="text-lg font-bold">{dayjs(day).format("D")}</span>
                  {renderDateMarkers(day)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-2">Gasto diario de la semana</p>
            <div className="grid grid-cols-7 gap-2 items-end h-24">
              {weeklyExpenseData.map((row) => (
                <div key={row.key} className="flex flex-col items-center gap-1">
                  <div className="w-full max-w-[24px] h-16 bg-gray-100 rounded-md flex items-end">
                    <div
                      className="w-full bg-red-400 rounded-md"
                      style={{ height: `${Math.max(row.percent, row.amount > 0 ? 8 : 0)}%` }}
                      title={formatCurrency(row.amount)}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase">{row.dayLabel}</span>
                  <span className="text-[10px] text-gray-600">
                    {formatCurrency(row.amount, { withSymbol: false })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>
      )}

      <SectionPanel title={dayjs(selectedDate).format("D MMMM YYYY")}>
        {selectedDayTransactions.length === 0 ? (
          <EmptyState
            title="No hay transacciones este día."
            description="Agrega un movimiento para verlo reflejado en el calendario."
          />
        ) : (
          <ul className="space-y-2">
            {selectedDayTransactions.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon category={item.category} type={item.type} />
                  <div>
                    <p className="font-medium text-gray-800">{item.category}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(item.parsedDate)} · {item.account || "Sin método"}
                    </p>
                    {item.notes ? <p className="text-xs text-gray-500">{item.notes}</p> : null}
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    item.type === "Ingreso" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatSignedCurrency(item.amount, { income: item.type === "Ingreso", compact: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 bg-[#0a2b6e] text-white rounded-full p-4 shadow-lg hover:bg-[#081f52] transition"
      >
        <Plus size={24} />
      </button>

      <AddTransactionModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTransaction}
      />
    </div>
  );
}

