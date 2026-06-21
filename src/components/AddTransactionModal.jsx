import React, { useCallback, useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import { logError } from "../services/logger";
import Button from "./ui/Button";

export default function AddTransactionModal({ show, onClose, onAdd, initialData = null }) {
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
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const categoryTitleId = useId();
  const categoryDescriptionId = useId();
  const categoryFieldId = useId();
  const amountFieldId = useId();
  const dateFieldId = useId();
  const accountFieldId = useId();
  const notesFieldId = useId();
  const newCategoryFieldId = useId();

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

  const handleConfirmAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const normalizedType = type === "income" ? "ingreso" : "gasto";
    const exists = categories.some(
      (item) =>
        item.name.toLowerCase() === trimmed.toLowerCase() &&
        item.type?.toLowerCase() === normalizedType
    );

    if (exists) {
      toast.error(`La categoria "${trimmed}" ya existe en ${normalizedType}.`);
      return;
    }

    try {
      setAddingCategory(true);
      await addCategory(trimmed, normalizedType);
      setCategory(trimmed);
      toast.success(`Categoria "${trimmed}" anadida correctamente.`);
      closeCategoryModal();
    } catch (error) {
      logError("Error al anadir categoria", error, { source: "transactions.add-category" });
      toast.error("No se pudo anadir la categoria");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!category || amount === "") {
      toast.error("Completa la categoria y el monto");
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
      logError("Error al guardar transaccion", error, { source: "transactions.save-modal" });
      toast.error("Error al guardar transaccion");
    }
  };

  const filteredCategories = categories.filter((item) =>
    type === "income"
      ? item.type?.toLowerCase() === "ingreso"
      : item.type?.toLowerCase() === "gasto"
  );

  const inputClass =
    "min-h-12 w-full rounded-2xl border border-[#d6e4f7] bg-white px-4 py-3 text-[#06142e] outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10";
  const labelClass = "mb-1.5 block text-sm font-semibold text-[#0a2b6e]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="relative flex max-h-[94vh] w-full max-w-lg animate-fadeIn flex-col overflow-hidden rounded-t-[2rem] border border-[#dbe8ff] bg-white shadow-[0_28px_70px_rgba(10,43,110,0.22)] sm:max-h-[90vh] sm:rounded-[1.75rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescriptionId}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-[#edf3ff] px-5 py-4 sm:px-6">
          <div>
            <h3 id={modalTitleId} className="text-lg font-semibold text-[#0a2b6e]">
              {initialData ? "Editar transaccion" : "Anadir transaccion"}
            </h3>
            <p id={modalDescriptionId} className="text-sm text-slate-500">
              {initialData ? "Actualiza los datos del movimiento." : "Registra un ingreso o gasto del dia."}
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
                type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label htmlFor={categoryFieldId} className={labelClass}>
              Categoria
            </label>
            <div className="flex items-center gap-2">
              <select
                id={categoryFieldId}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecciona una categoria</option>
                {filteredCategories.map((item) => (
                  <option key={item.id || item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f67ff] to-[#11c69a] text-white shadow-[0_12px_24px_rgba(31,103,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(31,103,255,0.28)]"
                title="Nueva categoria"
                aria-label="Nueva categoria"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={amountFieldId} className={labelClass}>
              Monto
            </label>
            <input
              id={amountFieldId}
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              className={`${inputClass} text-lg font-semibold`}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={dateFieldId} className={labelClass}>
                Fecha
              </label>
              <input
                id={dateFieldId}
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={accountFieldId} className={labelClass}>
                Metodo
              </label>
              <select
                id={accountFieldId}
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className={inputClass}
              >
                {methods.map((item) => (
                  <option key={item.id || item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={notesFieldId} className={labelClass}>
              Notas
            </label>
            <textarea
              id={notesFieldId}
              placeholder="Notas (opcional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
            <Button type="submit" variant={type === "income" ? "success" : "brand"} className="w-full sm:w-auto">
              {initialData ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="w-full max-w-sm rounded-t-[2rem] border border-[#dbe8ff] bg-white p-5 shadow-[0_28px_70px_rgba(10,43,110,0.22)] sm:rounded-[1.75rem]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={categoryTitleId}
            aria-describedby={categoryDescriptionId}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            <h4 id={categoryTitleId} className="mb-1 text-base font-semibold text-[#0a2b6e]">
              Nueva categoria
            </h4>
            <p id={categoryDescriptionId} className="mb-3 text-sm text-slate-500">
              Se creara como {type === "income" ? "categoria de ingreso" : "categoria de gasto"}.
            </p>
            <label htmlFor={newCategoryFieldId} className="sr-only">
              Nombre de categoria
            </label>
            <input
              id={newCategoryFieldId}
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
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
                variant="brand"
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
