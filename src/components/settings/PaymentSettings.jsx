import { useState } from "react";
import { CreditCard, Pencil, PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import ConfirmModal from "../ConfirmModal";
import { settingsInputClass } from "../../utils/settings";
import { SettingsEmptyState } from "./SettingsPrimitives";

export default function PaymentSettings({ methods, addMethod, editMethod, deleteMethod }) {
  const [newMethod, setNewMethod] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = async () => {
    if (!newMethod.trim()) {
      toast.error("Escribe un método");
      return;
    }

    await addMethod(newMethod);
    setNewMethod("");
  };

  const handleSave = async (id) => {
    if (!editName.trim()) {
      toast.error("El nombre no puede estar vacio");
      return;
    }

    await editMethod(id, editName);
    setEditingId(null);
    setEditName("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    await deleteMethod(deleteTarget.id);
    toast.success("Método de pago eliminado");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f67ff]">Cuentas</p>
        <h3 className="text-xl font-bold text-[#06142e]">Métodos de pago ({methods.length})</h3>
        <p className="text-sm text-slate-500">Administra las fuentes que usas para registrar movimientos.</p>
      </div>

      <div className="rounded-[1.75rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0a2b6e]">
          <PlusCircle size={17} />
          Agregar método de pago
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          placeholder="Nuevo método de pago"
          className={`${settingsInputClass} flex-1`}
        />
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
          Puedes registrar efectivo, tarjetas, transferencias o billeteras. Al eliminar un método,
          las transacciones antiguas conservarán el nombre usado.
        </p>
      </div>

      {methods.length === 0 ? (
        <SettingsEmptyState
          icon={CreditCard}
          title="Aún no hay métodos registrados"
          description="Agrega tus formas de pago habituales para clasificar mejor cada movimiento."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex flex-col gap-3 rounded-[1.5rem] border border-[#eef4ff] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              {editingId === method.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`${settingsInputClass} flex-1`}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#0a2b6e]">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <span className="block font-bold text-[#06142e]">{method.name}</span>
                    <span className="text-xs font-semibold text-slate-500">Disponible para transacciones</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {editingId === method.id ? (
                  <Button
                    type="button"
                    onClick={() => handleSave(method.id)}
                    variant="success"
                    size="sm"
                  >
                    Guardar
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(method.id);
                      setEditName(method.name);
                    }}
                    className="rounded-xl bg-[#e9f2ff] p-2 text-[#0a2b6e] transition hover:bg-[#d9ecff]"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(method)}
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

      <ConfirmModal
        show={!!deleteTarget}
        title="Eliminar método de pago"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Las transacciones antiguas conservarán ese método.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
