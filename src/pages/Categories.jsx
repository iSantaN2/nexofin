import React, { useState } from "react";
import { useCategories } from "../context/CategoriesContext";
import { Plus, Edit, Trash } from "lucide-react";
import toast from "react-hot-toast";

export default function Categories() {
  const { categories, addCategory, editCategory, deleteCategory } = useCategories();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("gasto");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("gasto");

  // ðŸŸ¢ Agregar categorÃ­a
  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return toast.error("Por favor, escribe un nombre.");

    // Evita duplicados
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error(`La categorÃ­a "${trimmed}" ya existe.`);
      return;
    }

    try {
      await addCategory(trimmed, newType);
      toast.success(`CategorÃ­a "${trimmed}" aÃ±adida correctamente`);
      setNewName("");
    } catch (error) {
      console.error("âŒ Error al agregar categorÃ­a:", error);
      toast.error("No se pudo agregar la categorÃ­a.");
    }
  };

  // âœï¸ Editar categorÃ­a
  const handleEdit = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) return toast.error("El nombre no puede estar vacÃ­o.");

    // Si el nombre no cambiÃ³, no actualizar
    const current = categories.find((c) => c.id === id);
    if (current && current.name === trimmed && current.type === editType) {
      toast("No se detectaron cambios.");
      setEditId(null);
      return;
    }

    // Evita duplicar nombre al editar
    const exists = categories.some(
      (c) =>
        c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error(`Ya existe una categorÃ­a con el nombre "${trimmed}".`);
      return;
    }

    try {
      await editCategory(id, { name: trimmed, type: editType });
      toast.success("CategorÃ­a actualizada correctamente");
      setEditId(null);
    } catch (error) {
      console.error("âŒ Error al actualizar categorÃ­a:", error);
      toast.error("No se pudo actualizar la categorÃ­a.");
    }
  };

  // ðŸ—‘ï¸ Eliminar categorÃ­a
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Â¿Eliminar la categorÃ­a "${name}"?`)) return;
    try {
      await deleteCategory(id);
      toast.success(`CategorÃ­a "${name}" eliminada`);
    } catch (error) {
      console.error("âŒ Error al eliminar categorÃ­a:", error);
      toast.error("No se pudo eliminar la categorÃ­a.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-[#0a2b6e]">CategorÃ­as</h2>

      {/* ðŸ§¾ Formulario para agregar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categorÃ­a"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2"
        >
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <button
          onClick={handleAdd}
          className="bg-[#0a2b6e] text-white px-3 py-2 rounded-lg hover:bg-[#081f52] flex items-center gap-1"
        >
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* ðŸ“‹ Lista de categorÃ­as */}
      <ul className="space-y-2">
        {categories.map((cat, index) => (
          <li
            key={cat.id || `${cat.name}-${index}`}
            className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg"
          >
            {editId === cat.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1"
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1"
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
                <button
                  onClick={() => handleEdit(cat.id)}
                  className="bg-green-600 text-white px-3 rounded-lg hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <>
                <div>
                  <span className="font-medium">{cat.name}</span>{" "}
                  <span className="text-sm text-gray-500">({cat.type})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(cat.id);
                      setEditName(cat.name);
                      setEditType(cat.type);
                    }}
                    className="text-[#0a2b6e] hover:text-[#0a2b6e]"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

