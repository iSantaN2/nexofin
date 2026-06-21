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
import { FileDown, Eye, FileText, X, PlusCircle, FileSpreadsheet } from "lucide-react";
import "dayjs/locale/es";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageHero from "../components/ui/PageHero";
import SectionPanel from "../components/ui/SectionPanel";
import UiMetricCard from "../components/ui/MetricCard";
import { calculateTotals } from "../utils/finance";
import {
  PERIODS,
  buildBaseFileName,
  buildPeriodBarData,
  buildReportInsights,
  buildTrendData,
  escapeCsvValue,
  filterTransactionsByCategory,
  filterTransactionsByRange,
  formatAccountingDateTime,
  getAverageTicket,
  getMethodsBreakdown,
  getPeriodLabel,
  getPeriodRange,
  getReportCategories,
  getReportComparison,
  getReportHealth,
  getTopExpenseCategories,
  normalizeReportTransactions,
} from "../services/reportAnalytics";

dayjs.locale("es");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildExcelTable(headers, rows) {
  const headerCells = headers.map((value) => `<th>${escapeHtml(value)}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`
    )
    .join("");

  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

export default function Reports() {
  const { transactions } = useContext(TransactionsContext);

  const [filter, setFilter] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [showModal, setShowModal] = useState(false);

  const cleanTransactions = useMemo(
    () => normalizeReportTransactions(transactions),
    [transactions]
  );

  const categories = useMemo(() => getReportCategories(cleanTransactions), [cleanTransactions]);

  const range = useMemo(() => getPeriodRange(filter), [filter]);

  const rangeTransactions = useMemo(
    () => filterTransactionsByRange(cleanTransactions, range),
    [cleanTransactions, range]
  );

  const visibleTransactions = useMemo(
    () => filterTransactionsByCategory(rangeTransactions, selectedCategory),
    [rangeTransactions, selectedCategory]
  );

  const previousTransactions = useMemo(() => {
    if (!range.previousStart || !range.previousEnd) return [];

    return filterTransactionsByCategory(
      filterTransactionsByRange(cleanTransactions, {
        start: range.previousStart,
        end: range.previousEnd,
      }),
      selectedCategory
    );
  }, [cleanTransactions, range, selectedCategory]);

  const totals = useMemo(() => calculateTotals(visibleTransactions), [visibleTransactions]);
  const previousTotals = useMemo(() => calculateTotals(previousTransactions), [previousTransactions]);

  const comparison = useMemo(
    () => getReportComparison(totals, previousTotals),
    [totals, previousTotals]
  );

  const averageTicket = useMemo(
    () => getAverageTicket(visibleTransactions, totals),
    [visibleTransactions, totals]
  );

  const health = useMemo(() => getReportHealth(totals), [totals]);

  const topExpenseCategories = useMemo(
    () => getTopExpenseCategories(visibleTransactions, totals.gastos),
    [visibleTransactions, totals.gastos]
  );

  const methodsBreakdown = useMemo(
    () => getMethodsBreakdown(visibleTransactions),
    [visibleTransactions]
  );

  const trendData = useMemo(
    () => buildTrendData({ transactions: cleanTransactions, selectedCategory }),
    [cleanTransactions, selectedCategory]
  );

  const periodBarData = useMemo(
    () => buildPeriodBarData({ rangeLabel: range.label, totals }),
    [range.label, totals]
  );

  const insights = useMemo(
    () =>
      buildReportInsights({
        topExpenseCategories,
        previousTransactionsLength: previousTransactions.length,
        diffExpense: comparison.diffExpense,
        methodsBreakdown,
      }),
    [topExpenseCategories, previousTransactions.length, comparison.diffExpense, methodsBreakdown]
  );

  const exportToCSV = () => {
    const metaRows = [
      ["Reporte", "NexoFin"],
      ["Periodo", getPeriodLabel(filter)],
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

  const exportToExcel = () => {
    const baseFileName = buildBaseFileName(filter, selectedCategory);
    const periodLabel = getPeriodLabel(filter);
    const summaryTable = buildExcelTable(
      ["Indicador", "Valor"],
      [
        ["Reporte", "NexoFin"],
        ["Periodo", periodLabel],
        ["Categoria", selectedCategory],
        ["Generado", dayjs().format("DD/MM/YYYY HH:mm")],
        ["Total ingresos", totals.ingresos.toFixed(2)],
        ["Total gastos", totals.gastos.toFixed(2)],
        ["Balance", totals.balance.toFixed(2)],
        ["Ticket ingreso", averageTicket.incomeAvg.toFixed(2)],
        ["Ticket gasto", averageTicket.expenseAvg.toFixed(2)],
      ]
    );
    const movementsTable = buildExcelTable(
      ["Fecha", "Tipo", "Categoria", "Metodo", "Monto", "Notas"],
      visibleTransactions.map((tx) => [
        formatAccountingDateTime(tx),
        tx.type,
        tx.category,
        tx.account,
        tx.amount.toFixed(2),
        tx.notes || "",
      ])
    );
    const trendTable = buildExcelTable(
      ["Mes", "Ingresos", "Gastos", "Balance"],
      trendData.map((item) => [
        item.month,
        item.ingresos.toFixed(2),
        item.gastos.toFixed(2),
        item.balance.toFixed(2),
      ])
    );
    const workbookHtml = `<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;margin-bottom:24px}th,td{border:1px solid #cbd5e1;padding:6px 10px}th{background:#0a2b6e;color:#fff}h2{color:#0a2b6e}</style></head><body><h2>Resumen</h2>${summaryTable}<h2>Movimientos</h2>${movementsTable}<h2>Tendencia</h2>${trendTable}</body></html>`;
    const blob = new Blob([`\uFEFF${workbookHtml}`], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${baseFileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.text("Reporte financiero - NexoFin", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periodo: ${getPeriodLabel(filter)}`, 14, 22);
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
    <div className="space-y-6">
      <PageHero
        eyebrow="Analitica"
        title="Reportes financieros"
        description={`Lee tendencias de ${range.label.toLowerCase()}, compara resultados y exporta reportes listos para compartir.`}
        stats={[
          {
            label: "Balance",
            value: `S/ ${totals.balance.toFixed(2)}`,
            tone: totals.balance >= 0 ? "success" : "danger",
          },
          {
            label: "Gastos",
            value: `S/ ${totals.gastos.toFixed(2)}`,
            tone: "danger",
          },
          {
            label: "Ticket gasto",
            value: `S/ ${averageTicket.expenseAvg.toFixed(2)}`,
            tone: "warning",
          },
          {
            label: "Salud",
            value: health.label,
            tone: health.color.includes("green")
              ? "success"
              : health.color.includes("red")
              ? "danger"
              : "warning",
          },
        ]}
      />

      <SectionPanel className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                filter === item.value
                  ? "bg-gradient-to-r from-[#1f67ff] to-[#11c69a] text-white shadow-sm"
                  : "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 text-sm text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
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
            className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 text-sm text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex justify-start gap-2 md:justify-end">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileDown size={16} /> PDF
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <FileText size={16} /> CSV
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <FileSpreadsheet size={16} /> Excel
            </Button>
            <Button onClick={() => setShowModal(true)} variant="brand" size="sm">
              <Eye size={16} /> Detalle
            </Button>
          </div>
        </div>
      </SectionPanel>

      {visibleTransactions.length === 0 ? (
        <EmptyState
          title="No hay movimientos para este reporte."
          description="Prueba otro periodo, cambia la categoria o registra movimientos para generar metricas utiles."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={resetFilters} variant="soft">
                Limpiar filtros
              </Button>
              <Link
                to="/transactions"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1f67ff] to-[#11c69a] px-4 py-2 font-semibold text-white shadow-[0_10px_24px_rgba(31,103,255,0.2)] transition hover:-translate-y-0.5"
              >
                <PlusCircle size={16} /> Agregar transaccion
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <UiMetricCard title="Ingresos" value={`S/ ${totals.ingresos.toFixed(2)}`} color="green" />
            <UiMetricCard title="Gastos" value={`S/ ${totals.gastos.toFixed(2)}`} color="red" />
            <UiMetricCard
              title="Balance"
              value={`S/ ${totals.balance.toFixed(2)}`}
              color={totals.balance >= 0 ? "green" : "red"}
            />
            <UiMetricCard
              title="Ticket ingreso"
              value={`S/ ${averageTicket.incomeAvg.toFixed(2)}`}
              color="blue"
            />
            <UiMetricCard
              title="Ticket gasto"
              value={`S/ ${averageTicket.expenseAvg.toFixed(2)}`}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SectionPanel title="Comparacion vs periodo anterior" className="space-y-2">
              {previousTransactions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aun no hay datos del periodo anterior para comparar. Cuando tengas mas historial,
                  NexoFin mostrara la diferencia automaticamente.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Balance:{" "}
                    <span className={comparison.diffBalance >= 0 ? "text-green-600" : "text-red-600"}>
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
            </SectionPanel>

            <SectionPanel title="Salud financiera" className="space-y-2">
              <p className={`text-lg font-bold ${health.color}`}>{health.label}</p>
              <p className="text-sm text-gray-600">{health.description}</p>
              {insights.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                  {insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              )}
            </SectionPanel>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionPanel title="Periodo actual: ingresos vs gastos" className="p-4">
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
            </SectionPanel>

            <SectionPanel title="Tendencia ultimos 6 meses" className="p-4">
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
            </SectionPanel>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#e4edff] bg-white p-4 shadow">
              <h3 className="mb-3 font-semibold">Top categorias de gasto</h3>
              {topExpenseCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No hay gastos en este periodo.</p>
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

            <div className="rounded-2xl border border-[#e4edff] bg-white p-4 shadow">
              <h3 className="mb-3 font-semibold">Gasto por metodo de pago</h3>
              {methodsBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No hay gastos en este periodo.</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold sm:text-xl">Detalle de transacciones</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 transition hover:text-gray-800"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap justify-center gap-3 sm:justify-end">
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <FileDown size={16} /> PDF
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <FileText size={16} /> CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
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
                    <tr key={tx.id} className="border-t transition hover:bg-gray-50">
                      <td className="whitespace-nowrap p-2">{formatAccountingDateTime(tx)}</td>
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
                      <td className="max-w-[160px] truncate p-2 text-gray-500">{tx.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowModal(false)} variant="outline">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
