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

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn relative overflow-hidden border border-[#dbe8ff]">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf3ff] px-5 py-4">
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

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 rounded-md text-sm font-semibold transition ${
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
              className={`py-2 rounded-md text-sm font-semibold transition ${
                type === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg p-2.5"
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
              className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#1f67ff] text-white hover:bg-[#0a2b6e]"
              title="Nueva categoría"
              aria-label="Nueva categoría"
            >
              <Plus size={18} />
            </button>
          </div>

          <input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full border rounded-lg p-2.5 text-lg font-semibold"
            required
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg p-2.5"
          />

          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border rounded-lg p-2.5"
          >
            {methods.map((m) => (
              <option key={m.id || m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg p-2.5 resize-none"
            rows={3}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="neutral"
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
            >
              {initialData ? "Guardar cambios" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 border border-[#dbe8ff]">
            <h4 className="text-base font-semibold text-[#0a2b6e] mb-1">Nueva categoría</h4>
            <p className="text-sm text-slate-500 mb-3">
              Se creará como {type === "income" ? "categoría de ingreso" : "categoría de gasto"}.
            </p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Escribe el nombre"
              className="w-full border rounded-lg p-2.5 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="neutral"
                onClick={closeCategoryModal}
                disabled={addingCategory}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
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

