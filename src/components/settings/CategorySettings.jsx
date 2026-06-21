import { useState } from "react";
import { LayoutGrid, Pencil, PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import ConfirmModal from "../ConfirmModal";
import { settingsInputClass } from "../../utils/settings";
import { SettingsEmptyState } from "./SettingsPrimitives";

export default function CategorySettings({ categories, addCategory, editCategory, deleteCategory }) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("gasto");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("gasto");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Escribe una categoría");
      return;
    }

    await addCategory(trimmed, newType);
    setNewName("");
  };

  const handleSave = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("El nombre no puede estar vacio");
      return;
    }

    await editCategory(id, { name: trimmed, type: editType });
    setEditingId(null);
    setEditName("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    await deleteCategory(deleteTarget.id);
    toast.success("Categoría eliminada");
    setDeleteTarget(null);
  };

  const expenseCategories = categories.filter((item) => item.type === "gasto");
  const incomeCategories = categories.filter((item) => item.type === "ingreso");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f67ff]">Catálogo</p>
          <h3 className="text-xl font-bold text-[#06142e]">Categorías ({categories.length})</h3>
          <p className="text-sm text-slate-500">Ordena tus movimientos por tipo y mantén tus reportes claros.</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0a2b6e]">
          <PlusCircle size={17} />
          Crear nueva categoría
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoría"
          className={`${settingsInputClass} flex-1`}
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className={`${settingsInputClass} md:w-44`}
        >
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <Button
          type="button"
          onClick={handleAdd}
          variant="brand"
          size="lg"
        >
          Agregar
        </Button>
        </div>
        <p className="mt-3 rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-slate-500">
          Consejo: usa nombres claros como Comida, Transporte o Sueldo. Si eliminas una categoría,
          tus transacciones antiguas conservarán su nombre, pero ya no aparecerá como opción nueva.
        </p>
      </div>

      <CategoryList
        title="Categorías de gasto"
        items={expenseCategories}
        editingId={editingId}
        editName={editName}
        editType={editType}
        setEditName={setEditName}
        setEditType={setEditType}
        setEditingId={setEditingId}
        onSave={handleSave}
        onDelete={setDeleteTarget}
      />

      <CategoryList
        title="Categorías de ingreso"
        items={incomeCategories}
        editingId={editingId}
        editName={editName}
        editType={editType}
        setEditName={setEditName}
        setEditType={setEditType}
        setEditingId={setEditingId}
        onSave={handleSave}
        onDelete={setDeleteTarget}
      />

      <ConfirmModal
        show={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Las transacciones antiguas conservarán ese nombre.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CategoryList({
  title,
  items,
  editingId,
  editName,
  editType,
  setEditName,
  setEditType,
  setEditingId,
  onSave,
  onDelete,
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-bold text-[#06142e]">{title}</h4>
        <span className="rounded-full bg-[#eff8ff] px-3 py-1 text-xs font-semibold text-[#0a2b6e]">
          {items.length} registros
        </span>
      </div>
      {items.length === 0 ? (
        <SettingsEmptyState
          icon={LayoutGrid}
          title="Aún no hay registros"
          description="Cuando agregues elementos de este tipo aparecerán aquí para editarlos o eliminarlos."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-[#eef4ff] bg-[#fbfdff] p-3 sm:flex-row sm:items-center sm:justify-between"
              data-testid="category-row"
            >
              {editingId === item.id ? (
                <div className="flex-1 flex flex-col md:flex-row gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`${settingsInputClass} flex-1`}
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className={`${settingsInputClass} md:w-36`}
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#0a2b6e]">
                    <LayoutGrid size={17} />
                  </span>
                  <div>
                    <p className="font-bold text-[#06142e]">{item.name}</p>
                    <p className="text-xs font-semibold capitalize text-slate-500">{item.type}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {editingId === item.id ? (
                  <Button
                    type="button"
                    onClick={() => onSave(item.id)}
                    variant="success"
                    size="sm"
                  >
                    Guardar
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                      setEditType(item.type || "gasto");
                    }}
                    className="rounded-xl bg-[#e9f2ff] p-2 text-[#0a2b6e] transition hover:bg-[#d9ecff]"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="rounded-xl bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
