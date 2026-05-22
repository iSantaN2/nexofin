import React, { useEffect, useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import toast from "react-hot-toast";

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

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName("");
    setAddingCategory(false);
  };

  const resetForm = () => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDate(toLocalDateInputValue(new Date()));
    setAccount("Efectivo");
    setNotes("");
    closeCategoryModal();
  };

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
  }, [initialData, show]);

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
      console.error("Error al anadir categoria:", error);
      toast.error("No se pudo anadir la categoria");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.error("Error al guardar transaccion:", error);
      toast.error("Error al guardar transaccion");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    type === "income"
      ? cat.type?.toLowerCase() === "ingreso"
      : cat.type?.toLowerCase() === "gasto"
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 animate-fadeIn relative">
        <h3 className="text-lg font-semibold mb-4 text-center">
          {initialData ? "Editar transaccion" : "Anadir transaccion"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-lg ${
                type === "expense"
                  ? "bg-red-100 text-red-600 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-lg ${
                type === "income"
                  ? "bg-green-100 text-green-600 font-semibold"
                  : "bg-gray-100"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Selecciona una categoria</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="px-3 py-2 rounded-lg bg-[#1f67ff] text-white hover:bg-[#0a2b6e]"
            >
              +
            </button>
          </div>

          <input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full border rounded-lg p-2"
            required
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border rounded-lg p-2"
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
            className="w-full border rounded-lg p-2 resize-none"
            rows={3}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0a2b6e] text-white hover:bg-[#081f52] rounded-lg"
            >
              {initialData ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5">
            <h4 className="text-base font-semibold mb-3">Nueva categoria</h4>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Escribe el nombre"
              className="w-full border rounded-lg p-2 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCategoryModal}
                disabled={addingCategory}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                className="px-4 py-2 bg-[#0a2b6e] text-white hover:bg-[#081f52] rounded-lg disabled:opacity-60"
              >
                {addingCategory ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
