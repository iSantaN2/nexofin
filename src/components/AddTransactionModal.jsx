import React, { useCallback, useEffect, useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import Button from "./ui/Button";

export default function AddTransactionModal({
  show,
  onClose,
  onAdd,
  initialData = null,
}) {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [account, setAccount] = useState("Efectivo");
  const [notes, setNotes] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const { categories, addCategory } = useCategories();
  const { methods } = usePaymentMethods();

  const toLocalDateInputValue = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const closeCategoryModal = useCallback(() => {
    setShowCategoryModal(false);
    setNewCategoryName("");
    setAddingCategory(false);
  }, []);

  const resetForm = useCallback(() => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDate(toLocalDateInputValue(new Date()));
    setAccount("Efectivo");
    setNotes("");
    closeCategoryModal();
  }, [closeCategoryModal]);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type === "Ingreso" ? "income" : "expense");
      setCategory(initialData.category || "");
      setAmount(initialData.amount || "");
      setDate(toLocalDateInputValue(initialData.date));
      setAccount(initialData.account || "Efectivo");
      setNotes(initialData.notes || "");
      closeCategoryModal();
    } else {
      resetForm();
    }
  }, [closeCategoryModal, initialData, resetForm, show]);

  if (!show) return null;

  const handleOpenAddCategory = () => {
    setShowCategoryModal(true);
  };

  const handleConfirmAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const normalizedType = type === "income" ? "ingreso" : "gasto";
    const exists = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        c.type?.toLowerCase() === normalizedType
    );

    if (exists) {
      toast.error(`La categoría "${trimmed}" ya existe en ${normalizedType}.`);
      return;
    }

    try {
      setAddingCategory(true);
      await addCategory(trimmed, normalizedType);
      setCategory(trimmed);
      toast.success(`Categoría "${trimmed}" añadida correctamente.`);
      closeCategoryModal();
    } catch (error) {
      console.error("Error al añadir categoría:", error);
      toast.error("No se pudo añadir la categoría");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);

    if (!category || amount === "") {
      toast.error("Completa la categoría y el monto");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    const now = new Date();
    const createdAt = initialData?.createdAt
      ? new Date(initialData.createdAt).toISOString()
      : now.toISOString();

    let finalDate = now.toISOString();

    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const baseTime = initialData?.date ? new Date(initialData.date) : now;
      const composedDate = new Date(
        year,
        month - 1,
        day,
        baseTime.getHours(),
        baseTime.getMinutes(),
        baseTime.getSeconds(),
        baseTime.getMilliseconds()
      );
      finalDate = composedDate.toISOString();
    }

    const payload = {
      id: initialData?.id || undefined,
      type: type === "income" ? "Ingreso" : "Gasto",
      category,
      amount: parsedAmount,
      date: finalDate,
      createdAt,
      account,
      notes,
    };

    try {
      const result = await onAdd(payload);
      const wasSuccessful = initialData ? result !== false : Boolean(result);

      if (!wasSuccessful) return;

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error al guardar transacción:", error);
      toast.error("Error al guardar transacción");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    type === "income"
      ? cat.type?.toLowerCase() === "ingreso"
      : cat.type?.toLowerCase() === "gasto"
  );

  const inputClass =
    "min-h-12 w-full rounded-2xl border border-[#d6e4f7] bg-white px-4 py-3 text-[#06142e] outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10";
  const labelClass = "mb-1.5 block text-sm font-semibold text-[#0a2b6e]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[94vh] w-full max-w-lg animate-fadeIn flex-col overflow-hidden rounded-t-[2rem] border border-[#dbe8ff] bg-white shadow-[0_28px_70px_rgba(10,43,110,0.22)] sm:max-h-[90vh] sm:rounded-[1.75rem]">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-[#edf3ff] px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0a2b6e]">
              {initialData ? "Editar transacción" : "Añadir transacción"}
            </h3>
            <p className="text-sm text-slate-500">
              {initialData ? "Actualiza los datos del movimiento." : "Registra un ingreso o gasto del día."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 pb-0 pt-5 sm:px-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                type === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                type === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className={labelClass}>Categoría</label>
            <div className="flex gap-2 items-center">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecciona una categoría</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f67ff] to-[#11c69a] text-white shadow-[0_12px_24px_rgba(31,103,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(31,103,255,0.28)]"
                title="Nueva categoría"
                aria-label="Nueva categoría"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Monto</label>
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className={`${inputClass} text-lg font-semibold`}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Método</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={inputClass}
              >
                {methods.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} min-h-24 resize-none`}
              rows={3}
            />
          </div>

          <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[#edf3ff] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="neutral"
              className="w-full sm:w-auto"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={type === "income" ? "success" : "primary"}
              className="w-full sm:w-auto"
            >
              {initialData ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-[2rem] border border-[#dbe8ff] bg-white p-5 shadow-[0_28px_70px_rgba(10,43,110,0.22)] sm:rounded-[1.75rem]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            <h4 className="text-base font-semibold text-[#0a2b6e] mb-1">Nueva categoría</h4>
            <p className="text-sm text-slate-500 mb-3">
              Se creará como {type === "income" ? "categoría de ingreso" : "categoría de gasto"}.
            </p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Escribe el nombre"
              className={`${inputClass} mb-4`}
              autoFocus
            />
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button
                type="button"
                variant="neutral"
                className="w-full sm:w-auto"
                onClick={closeCategoryModal}
                disabled={addingCategory}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                onClick={handleConfirmAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
              >
                {addingCategory ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

