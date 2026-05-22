import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TransactionsContext } from "../context/TransactionsContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, Eye, FileText, X, PlusCircle } from "lucide-react";
import "dayjs/locale/es";

dayjs.locale("es");

const PERIODS = [
  { value: "7days", label: "Ultimos 7 dias" },
  { value: "30days", label: "Ultimos 30 dias" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "year", label: "Este anio" },
  { value: "all", label: "Todo" },
];

function normalizeType(type) {
  return type === "Ingreso" || type === "income" ? "Ingreso" : "Gasto";
}

function normalizeField(value, fallback) {
  if (!value) return fallback;
  if (typeof value === "object") return value.name || fallback;
  return value;
}

function formatAccountingDateTime(tx) {
  return `${tx.date.format("DD/MM/YYYY")} ${tx.createdAt.format("HH:mm")}`;
}

function getPeriodRange(filter) {
  const now = dayjs();

  if (filter === "all") {
    return { label: "Todo el historial", start: null, end: null, previousStart: null, previousEnd: null };
  }

  if (filter === "7days") {
    const start = now.subtract(6, "day").startOf("day");
    const end = now.endOf("day");
    return {
      label: "Ultimos 7 dias",
      start,
      end,
      previousStart: start.subtract(7, "day"),
      previousEnd: end.subtract(7, "day"),
    };
  }

  if (filter === "30days") {
    const start = now.subtract(29, "day").startOf("day");
    const end = now.endOf("day");
    return {
      label: "Ultimos 30 dias",
      start,
      end,
      previousStart: start.subtract(30, "day"),
      previousEnd: end.subtract(30, "day"),
    };
  }

  if (filter === "week") {
    const start = now.startOf("week");
    const end = now.endOf("week");
    return {
      label: "Semana actual",
      start,
      end,
      previousStart: start.subtract(1, "week"),
      previousEnd: end.subtract(1, "week"),
    };
  }

  if (filter === "month") {
    const start = now.startOf("month");
    const end = now.endOf("month");
    return {
      label: "Mes actual",
      start,
      end,
      previousStart: start.subtract(1, "month"),
      previousEnd: end.subtract(1, "month"),
    };
  }

  const start = now.startOf("year");
  const end = now.endOf("year");
  return {
    label: "Anio actual",
    start,
    end,
    previousStart: start.subtract(1, "year"),
    previousEnd: end.subtract(1, "year"),
  };
}

function isInRange(date, start, end) {
  if (!start || !end) return true;
  if (!date?.isValid?.()) return false;
  return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
}

function calculateTotals(items) {
  let ingresos = 0;
  let gastos = 0;

  items.forEach((item) => {
    if (item.type === "Ingreso") ingresos += item.amount;
    else gastos += item.amount;
  });

  return { ingresos, gastos, balance: ingresos - gastos };
}

function buildRangeLabel(filter) {
  switch (filter) {
    case "7days":
      return "7dias";
    case "30days":
      return "30dias";
    case "week":
      return "semana";
    case "month":
      return "mes";
    case "year":
      return "anio";
    default:
      return "general";
  }
}

function buildBaseFileName(filter, selectedCategory) {
  const dateStamp = dayjs().format("YYYYMMDD_HHmm");
  const categoryStamp = selectedCategory === "todos" ? "todas" : selectedCategory;
  return `NexoFin_${buildRangeLabel(filter)}_${categoryStamp}_${dateStamp}`;
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getHealth(totals) {
  const savingsRate = totals.ingresos > 0 ? (totals.balance / totals.ingresos) * 100 : 0;

  if (savingsRate >= 20) {
    return { label: "Saludable", color: "text-emerald-600", description: `Ahorro ${savingsRate.toFixed(1)}%` };
  }

  if (savingsRate >= 5) {
    return { label: "Atencion", color: "text-amber-600", description: `Ahorro ${savingsRate.toFixed(1)}%` };
  }

  return { label: "Riesgo", color: "text-red-600", description: `Ahorro ${savingsRate.toFixed(1)}%` };
}

export default function Reports() {
  const { transactions } = useContext(TransactionsContext);

  const [filter, setFilter] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [showModal, setShowModal] = useState(false);

  const cleanTransactions = useMemo(
    () =>
      transactions
        .map((tx) => {
          const date = tx.date?.seconds ? dayjs.unix(tx.date.seconds) : dayjs(tx.date);
          const createdAt = tx.createdAt?.seconds
            ? dayjs.unix(tx.createdAt.seconds)
            : tx.createdAt
            ? dayjs(tx.createdAt)
            : date;

          return {
            ...tx,
            amount: Number(tx.amount) || 0,
            type: normalizeType(tx.type),
            category: normalizeField(tx.category, "Sin categoria"),
            account: normalizeField(tx.account, "Sin metodo"),
            notes: tx.notes || "",
            date,
            createdAt,
          };
        })
        .filter((tx) => tx.date?.isValid?.()),
    [transactions]
  );

  const categories = useMemo(
    () => ["todos", ...new Set(cleanTransactions.map((tx) => tx.category).filter(Boolean))],
    [cleanTransactions]
  );

  const range = useMemo(() => getPeriodRange(filter), [filter]);

  const rangeTransactions = useMemo(() => {
    return cleanTransactions.filter((tx) => isInRange(tx.date, range.start, range.end));
  }, [cleanTransactions, range]);

  const visibleTransactions = useMemo(() => {
    if (selectedCategory === "todos") return rangeTransactions;
    return rangeTransactions.filter((tx) => tx.category === selectedCategory);
  }, [rangeTransactions, selectedCategory]);

  const previousTransactions = useMemo(() => {
    if (!range.previousStart || !range.previousEnd) return [];

    const base = cleanTransactions.filter((tx) =>
      isInRange(tx.date, range.previousStart, range.previousEnd)
    );

    if (selectedCategory === "todos") return base;
    return base.filter((tx) => tx.category === selectedCategory);
  }, [cleanTransactions, range, selectedCategory]);

  const totals = useMemo(() => calculateTotals(visibleTransactions), [visibleTransactions]);
  const previousTotals = useMemo(() => calculateTotals(previousTransactions), [previousTransactions]);

  const comparison = useMemo(() => {
    const diffBalance = totals.balance - previousTotals.balance;
    const diffIncome = totals.ingresos - previousTotals.ingresos;
    const diffExpense = totals.gastos - previousTotals.gastos;

    const pctBalance =
      previousTotals.balance === 0 ? null : (diffBalance / Math.abs(previousTotals.balance)) * 100;

    return { diffBalance, diffIncome, diffExpense, pctBalance };
  }, [totals, previousTotals]);

  const averageTicket = useMemo(() => {
    const incomeItems = visibleTransactions.filter((tx) => tx.type === "Ingreso");
    const expenseItems = visibleTransactions.filter((tx) => tx.type === "Gasto");

    return {
      incomeAvg: incomeItems.length ? totals.ingresos / incomeItems.length : 0,
      expenseAvg: expenseItems.length ? totals.gastos / expenseItems.length : 0,
    };
  }, [visibleTransactions, totals]);

  const health = useMemo(() => getHealth(totals), [totals]);

  const topExpenseCategories = useMemo(() => {
    const grouped = {};
    visibleTransactions
      .filter((tx) => tx.type === "Gasto")
      .forEach((tx) => {
        grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
      });

    const totalExpense = totals.gastos || 1;
    return Object.entries(grouped)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: (amount / totalExpense) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [visibleTransactions, totals.gastos]);

  const methodsBreakdown = useMemo(() => {
    const grouped = {};

    visibleTransactions
      .filter((tx) => tx.type === "Gasto")
      .forEach((tx) => {
        grouped[tx.account] = (grouped[tx.account] || 0) + tx.amount;
      });

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [visibleTransactions]);

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const month = dayjs().startOf("month").subtract(5 - index, "month");
      const monthKey = month.format("YYYY-MM");

      const monthTransactions = cleanTransactions.filter((tx) => {
        if (tx.date.format("YYYY-MM") !== monthKey) return false;
        if (selectedCategory === "todos") return true;
        return tx.category === selectedCategory;
      });

      const monthTotals = calculateTotals(monthTransactions);
      return {
        month: month.format("MMM"),
        ingresos: monthTotals.ingresos,
        gastos: monthTotals.gastos,
        balance: monthTotals.balance,
      };
    });
  }, [cleanTransactions, selectedCategory]);

  const periodBarData = useMemo(
    () => [{ name: range.label, ingresos: totals.ingresos, gastos: totals.gastos }],
    [range.label, totals]
  );

  const insights = useMemo(() => {
    const lines = [];

    if (topExpenseCategories[0]) {
      lines.push(
        `Tu mayor gasto fue ${topExpenseCategories[0].name} con S/ ${topExpenseCategories[0].amount.toFixed(2)}.`
      );
    }

    if (previousTransactions.length > 0) {
      const direction = comparison.diffExpense > 0 ? "mas" : "menos";
      lines.push(
        `Gastaste S/ ${Math.abs(comparison.diffExpense).toFixed(2)} ${direction} que el periodo anterior.`
      );
    }

    if (methodsBreakdown[0]) {
      lines.push(`Tu metodo mas usado fue ${methodsBreakdown[0].name}.`);
    }

    return lines;
  }, [topExpenseCategories, previousTransactions.length, comparison.diffExpense, methodsBreakdown]);

  const exportToCSV = () => {
    const metaRows = [
      ["Reporte", "NexoFin"],
      ["Periodo", PERIODS.find((item) => item.value === filter)?.label || "Todo"],
      ["Categoria", selectedCategory],
      ["Generado", dayjs().format("DD/MM/YYYY HH:mm")],
      [],
    ];

    const headers = ["Fecha", "Tipo", "Categoria", "Metodo", "Monto", "Notas"];
    const rows = visibleTransactions.map((tx) => [
      formatAccountingDateTime(tx),
      tx.type,
      tx.category,
      tx.account,
      tx.amount.toFixed(2),
      tx.notes,
    ]);

    rows.push([]);
    rows.push(["Resumen", "", "", "", "", ""]);
    rows.push(["Total ingresos", "", "", "", totals.ingresos.toFixed(2), ""]);
    rows.push(["Total gastos", "", "", "", totals.gastos.toFixed(2), ""]);
    rows.push(["Balance", "", "", "", totals.balance.toFixed(2), ""]);

    const csvLines = [...metaRows, headers, ...rows].map((line) =>
      line.map((value) => escapeCsvValue(value)).join(",")
    );
    const csvContent = `\uFEFF${csvLines.join("\n")}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${buildBaseFileName(filter, selectedCategory)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte financiero - NexoFin", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periodo: ${PERIODS.find((item) => item.value === filter)?.label || "Todo"}`, 14, 22);
    doc.text(`Categoria: ${selectedCategory}`, 14, 27);
    doc.text(`Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [["Fecha", "Tipo", "Categoria", "Metodo", "Monto", "Notas"]],
      body: visibleTransactions.map((tx) => [
        formatAccountingDateTime(tx),
        tx.type,
        tx.category,
        tx.account,
        `S/ ${tx.amount.toFixed(2)}`,
        tx.notes || "-",
      ]),
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: finalY,
      theme: "grid",
      head: [["Resumen", "Monto"]],
      body: [
        ["Ingresos", `S/ ${totals.ingresos.toFixed(2)}`],
        ["Gastos", `S/ ${totals.gastos.toFixed(2)}`],
        ["Balance", `S/ ${totals.balance.toFixed(2)}`],
      ],
      styles: { halign: "right", fillColor: [240, 240, 240] },
      headStyles: { fillColor: [10, 43, 110], textColor: 255 },
    });

    doc.save(`${buildBaseFileName(filter, selectedCategory)}.pdf`);
  };

  const resetFilters = () => {
    setFilter("month");
    setSelectedCategory("todos");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reportes financieros</h1>
        <p className="text-sm text-gray-500 mt-1">Entiende tus patrones y toma mejores decisiones.</p>
      </div>

      <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                filter === item.value
                  ? "bg-[#0a2b6e] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            {PERIODS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex gap-2 justify-start md:justify-end">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 text-sm"
            >
              <FileDown size={16} /> PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 text-sm"
            >
              <FileText size={16} /> CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#1f67ff] text-white px-3 py-2 rounded-xl hover:bg-[#0a2b6e] text-sm"
            >
              <Eye size={16} /> Detalle
            </button>
          </div>
        </div>
      </div>

      {visibleTransactions.length === 0 ? (
        <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-10 text-center space-y-3">
          <p className="text-gray-500">No hay datos para los filtros seleccionados.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Limpiar filtros
            </button>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a2b6e] text-white hover:bg-[#081f52]"
            >
              <PlusCircle size={16} /> Agregar transaccion
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricCard title="Ingresos" value={totals.ingresos} color="green" />
            <MetricCard title="Gastos" value={totals.gastos} color="red" />
            <MetricCard title="Balance" value={totals.balance} color={totals.balance >= 0 ? "green" : "red"} />
            <MetricCard title="Ticket ingreso" value={averageTicket.incomeAvg} color="blue" />
            <MetricCard title="Ticket gasto" value={averageTicket.expenseAvg} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4 space-y-2">
              <h3 className="font-semibold">Comparacion vs periodo anterior</h3>
              {previousTransactions.length === 0 ? (
                <p className="text-sm text-gray-500">No hay base para comparar en el periodo anterior.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Balance: <span className={comparison.diffBalance >= 0 ? "text-green-600" : "text-red-600"}>
                      {comparison.diffBalance >= 0 ? "+" : ""}S/ {comparison.diffBalance.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Ingresos: {comparison.diffIncome >= 0 ? "+" : ""}S/ {comparison.diffIncome.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Gastos: {comparison.diffExpense >= 0 ? "+" : ""}S/ {comparison.diffExpense.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {comparison.pctBalance === null
                      ? "Sin porcentaje comparable."
                      : `Variacion de balance: ${comparison.pctBalance.toFixed(1)}%`}
                  </p>
                </>
              )}
            </div>

            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4 space-y-2">
              <h3 className="font-semibold">Salud financiera</h3>
              <p className={`text-lg font-bold ${health.color}`}>{health.label}</p>
              <p className="text-sm text-gray-600">{health.description}</p>
              {insights.length > 0 && (
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4">
              <h3 className="text-md font-semibold mb-3">Periodo actual: ingresos vs gastos</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={periodBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#4ade80" name="Ingresos" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="gastos" fill="#f87171" name="Gastos" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4">
              <h3 className="text-md font-semibold mb-3">Tendencia ultimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={3} name="Ingresos" />
                  <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} name="Gastos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4">
              <h3 className="font-semibold mb-3">Top categorias de gasto</h3>
              {topExpenseCategories.length === 0 ? (
                <p className="text-sm text-gray-500">Sin gastos en este periodo.</p>
              ) : (
                <ul className="space-y-2">
                  {topExpenseCategories.map((item) => (
                    <li key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900">
                        S/ {item.amount.toFixed(2)} ({item.percent.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4">
              <h3 className="font-semibold mb-3">Gasto por metodo de pago</h3>
              {methodsBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">Sin gastos en este periodo.</p>
              ) : (
                <ul className="space-y-2">
                  {methodsBreakdown.map((item) => (
                    <li key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900">S/ {item.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg sm:text-xl font-semibold">Detalle de transacciones</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 transition"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 justify-center sm:justify-end">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-xl hover:bg-red-600 text-sm"
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 text-sm"
              >
                <FileText size={16} /> CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2">Fecha</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">Metodo</th>
                    <th className="p-2">Monto</th>
                    <th className="p-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.map((tx) => (
                    <tr key={tx.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-2 whitespace-nowrap">{formatAccountingDateTime(tx)}</td>
                      <td
                        className={`p-2 font-medium ${
                          tx.type === "Ingreso" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.type}
                      </td>
                      <td className="p-2">{tx.category}</td>
                      <td className="p-2">{tx.account}</td>
                      <td className="p-2">S/ {tx.amount.toFixed(2)}</td>
                      <td className="p-2 text-gray-500 max-w-[160px] truncate">{tx.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-[#0a2b6e] text-white px-5 py-2 rounded-xl hover:bg-[#081f52] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, color }) {
  const colorMap = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
  };

  return (
    <div className={`rounded-xl p-3 text-center ${colorMap[color] || colorMap.blue}`}>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-lg font-bold">S/ {Number(value || 0).toFixed(2)}</p>
    </div>
  );
}
