// src/components/EditTransactionModal.jsx
import React, { useState, useEffect } from "react";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import toast from "react-hot-toast";

export default function EditTransactionModal({ show, onClose, transaction, onSave }) {
  const [type, setType] = useState("Gasto");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [account, setAccount] = useState("Efectivo");
  const [notes, setNotes] = useState("");

  // âœ… Contextos centralizados
  const { categories } = useCategories();
  const { methods } = usePaymentMethods();

  // âœ… Cargar datos al abrir modal
  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "Gasto");
      setCategory(transaction.category || "");
      setAmount(transaction.amount || "");
      setDate(transaction.date ? transaction.date.split("T")[0] : "");
      setAccount(transaction.account || "Efectivo");
      setNotes(transaction.notes || "");
    }
  }, [transaction]);

  if (!show || !transaction) return null;

  // âœ… Enviar datos actualizados
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category || !amount) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    if (!transaction.id || typeof transaction.id !== "string") {
      toast.error("TransacciÃ³n sin ID vÃ¡lido, no se puede actualizar");
      console.error("âŒ ID invÃ¡lido recibido:", transaction.id);
      return;
    }

    const updatedTransaction = {
      ...transaction, // âœ… conserva el ID real de Firestore
      type,
      category,
      amount: Number(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      account,
      notes,
    };

    console.log("ðŸ§© ID enviado desde modal para actualizar:", updatedTransaction.id);

    try {
      await onSave(updatedTransaction);
      toast.success("âœ… TransacciÃ³n actualizada correctamente");
      onClose();
    } catch (error) {
      console.error("âŒ Error al actualizar transacciÃ³n:", error);
      toast.error("No se pudo actualizar la transacciÃ³n");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 animate-fadeIn">
        <h3 className="text-lg font-semibold mb-4 text-center">Editar transacciÃ³n</h3>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* Tipo */}
          <div className="flex gap-2">
            {["Gasto", "Ingreso"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg transition ${
                  type === t
                    ? t === "Gasto"
                      ? "bg-red-100 text-red-600 font-semibold"
                      : "bg-green-100 text-green-600 font-semibold"
                    : "bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* CategorÃ­a */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">Selecciona una categorÃ­a</option>
            {categories
              .filter((cat) => {
                const catType = cat.type?.toLowerCase();
                if (type === "Ingreso") return catType === "ingreso";
                if (type === "Gasto") return catType === "gasto";
                return true;
              })
              .map((cat, i) => (
                <option key={cat.id || i} value={cat.name}>
                  {cat.name}
                </option>
              ))}
          </select>

          {/* Monto */}
          <input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          {/* Fecha */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg p-2"
          />

          {/* MÃ©todo de pago */}
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            {methods.map((m, i) => (
              <option key={m.id || i} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Notas */}
          <textarea
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
          />

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0a2b6e] text-white hover:bg-[#081f52]"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

