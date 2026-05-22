import React, { useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Target } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { TransactionsContext } from "../context/TransactionsContext";
import { useCategories } from "../context/CategoriesContext";

const APP_TIME_ZONE = "America/Lima";
const MONTH_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

const getCurrentMonthKey = () => {
  const parts = MONTH_KEY_FORMATTER.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return "";
  return `${year}-${month}`;
};

const toDate = (value) => {
  if (!value) return null;
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
};

const getYearMonthKey = (value) => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;

  const parts = MONTH_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return null;
  return `${year}-${month}`;
};

const isIncome = (transaction) =>
  transaction.type === "Ingreso" || transaction.type === "income";

const getStatus = (progress) => {
  if (progress >= 100) return { label: "Excedido", color: "text-red-600", bar: "bg-red-500" };
  if (progress >= 80)
    return { label: "En riesgo", color: "text-amber-600", bar: "bg-amber-500" };
  return { label: "Saludable", color: "text-emerald-600", bar: "bg-emerald-500" };
};

export default function Budgets() {
  const { budgets, upsertBudget, deleteBudget, loading } = useContext(AppContext);
  const { transactions } = useContext(TransactionsContext);
  const { categories } = useCategories();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((item) => item.type === "gasto").map((item) => item.name),
    [categories]
  );

  const budgetsForMonth = useMemo(
    () => budgets.filter((item) => item.monthKey === selectedMonth),
    [budgets, selectedMonth]
  );

  const spentByCategory = useMemo(() => {
    const totals = {};

    transactions
      .filter((tx) => getYearMonthKey(tx.date) === selectedMonth)
      .filter((tx) => !isIncome(tx))
      .forEach((tx) => {
        const category = tx.category || "Sin categoria";
        totals[category] = (totals[category] || 0) + (Number(tx.amount) || 0);
      });

    return totals;
  }, [transactions, selectedMonth]);

  const budgetCards = useMemo(() => {
    return budgetsForMonth
      .map((budget) => {
        const spent = spentByCategory[budget.category] || 0;
        const limit = Number(budget.limitAmount) || 0;
        const progress = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = limit - spent;
        return {
          ...budget,
          spent,
          limit,
          remaining,
          progress,
          status: getStatus(progress),
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [budgetsForMonth, spentByCategory]);

  const handleSaveBudget = async (e) => {
    e.preventDefault();

    if (!selectedCategory.trim()) {
      toast.error("Selecciona una categoria");
      return;
    }

    const amount = Number(limitAmount);
    if (!amount || amount <= 0) {
      toast.error("Ingresa una meta valida");
      return;
    }

    setSaving(true);
    try {
      await upsertBudget({
        category: selectedCategory,
        monthKey: selectedMonth,
        limitAmount: amount,
      });
      toast.success("Meta guardada correctamente");
      setLimitAmount("");
      setSelectedCategory("");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la meta");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      toast.success("Meta eliminada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la meta");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2b6e]">Metas de gasto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define limites por categoria y controla si vas saludable, en riesgo o excedido.
        </p>
      </div>

      <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="text-sm text-gray-600">Mes</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthKey())}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <form onSubmit={handleSaveBudget} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 md:col-span-2"
            required
          >
            <option value="">Selecciona categoria de gasto</option>
            {expenseCategories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            step="0.01"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Meta mensual (S/)"
            className="border rounded-lg px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-[#0a2b6e] hover:bg-[#081f52] text-white rounded-lg px-3 py-2 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar meta"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#e4edff] rounded-2xl shadow p-4">
        <h2 className="font-semibold text-[#0a2b6e] mb-3">Resumen del mes</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando metas...</p>
        ) : budgetCards.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes metas configuradas para este mes.</p>
        ) : (
          <div className="space-y-3">
            {budgetCards.map((item) => {
              const progressSafe = Math.max(0, Math.min(item.progress, 100));
              return (
                <div key={item.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        <Target size={15} className="text-[#0a2b6e]" />
                        {item.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Gastado: <span className="font-medium">S/ {item.spent.toFixed(2)}</span> de
                        <span className="font-medium"> S/ {item.limit.toFixed(2)}</span>
                      </p>
                      <p className={`text-xs font-semibold mt-1 ${item.status.color}`}>
                        {item.status.label} · {item.progress.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.remaining >= 0
                          ? `Te quedan S/ ${item.remaining.toFixed(2)} en esta categoria.`
                          : `Te pasaste por S/ ${Math.abs(item.remaining).toFixed(2)} en esta categoria.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(item.id)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                      title="Eliminar meta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full ${item.status.bar}`}
                      style={{ width: `${progressSafe}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
