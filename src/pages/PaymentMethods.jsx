import React, { useState } from "react";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import { Plus, Edit, Trash } from "lucide-react";

export default function PaymentMethods() {
  const { methods, addMethod, editMethod, deleteMethod } = usePaymentMethods();
  const [newMethod, setNewMethod] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMethod.trim()) return;
    await addMethod(newMethod);
    setNewMethod("");
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    await editMethod(id, editName);
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-[#0a2b6e]">
        MÃ©todos de Pago ðŸ’³
      </h2>

      {/* Formulario para agregar */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          placeholder="Agregar nuevo mÃ©todo..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#69d8c4]"
        />
        <button
          type="submit"
          className="bg-[#0a2b6e] hover:bg-[#081f52] text-white px-4 py-2 rounded-lg flex items-center gap-1"
        >
          <Plus size={18} /> Agregar
        </button>
      </form>

      {/* Lista de mÃ©todos */}
      <ul className="space-y-3">
        {methods.map((m) => (
          <li
            key={m.id}
            className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-[#eff8ff] transition"
          >
            {editingId === m.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
              />
            ) : (
              <span className="font-medium">{m.name}</span>
            )}

            <div className="flex gap-2">
              {editingId === m.id ? (
                <button
                  onClick={() => handleEdit(m.id)}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Guardar
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(m.id);
                    setEditName(m.name);
                  }}
                  className="text-[#0a2b6e] hover:text-[#0a2b6e]"
                >
                  <Edit size={18} />
                </button>
              )}
              <button
                onClick={() => deleteMethod(m.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

