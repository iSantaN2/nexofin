import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  UserCircle2,
  LayoutGrid,
  WalletCards,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { key: "profile", label: "Perfil", icon: UserCircle2 },
  { key: "categories", label: "Categorias", icon: LayoutGrid },
  { key: "methods", label: "Metodos de pago", icon: WalletCards },
];

function getAuthErrorMessage(error, fallback) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "La contrasena actual es incorrecta.";
    case "auth/requires-recent-login":
      return "Por seguridad, vuelve a iniciar sesion e intentalo otra vez.";
    case "auth/email-already-in-use":
      return "Ese correo ya esta en uso por otra cuenta.";
    case "auth/invalid-email":
      return "El correo no tiene un formato valido.";
    case "auth/weak-password":
      return "La nueva contrasena es muy debil.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e intentalo de nuevo.";
    case "permission-denied":
      return "No tienes permisos para borrar algunos datos en Firestore.";
    default:
      return fallback;
  }
}

function formatAuthDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { categories, addCategory, editCategory, deleteCategory } = useCategories();
  const { methods, addMethod, editMethod, deleteMethod } = usePaymentMethods();
  const { user, updateUserDisplayName, updateUserEmail, updateUserPassword, deleteUserAccount } =
    useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0a2b6e]">Ajustes</h1>
      <p className="text-gray-500">Gestiona perfil, categorias y metodos de pago</p>

      <div className="flex flex-wrap gap-2 border-b border-[#d9e6ff] pb-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === key
                ? "bg-[#0a2b6e] text-white"
                : "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow border border-[#e4edff]">
        {activeTab === "profile" && (
          <ProfileSettings
            user={user}
            updateUserDisplayName={updateUserDisplayName}
            updateUserEmail={updateUserEmail}
            updateUserPassword={updateUserPassword}
            deleteUserAccount={deleteUserAccount}
          />
        )}

        {activeTab === "categories" && (
          <CategorySettings
            categories={categories}
            addCategory={addCategory}
            editCategory={editCategory}
            deleteCategory={deleteCategory}
          />
        )}

        {activeTab === "methods" && (
          <PaymentSettings
            methods={methods}
            addMethod={addMethod}
            editMethod={editMethod}
            deleteMethod={deleteMethod}
          />
        )}
      </div>
    </div>
  );
}

function ProfileSettings({
  user,
  updateUserDisplayName,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
}) {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [nameLoading, setNameLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const securityInfo = useMemo(
    () => ({
      createdAt: formatAuthDate(user?.metadata?.creationTime),
      lastSignInAt: formatAuthDate(user?.metadata?.lastSignInTime),
      provider:
        user?.providerData?.[0]?.providerId === "password"
          ? "Correo y contrasena"
          : user?.providerData?.[0]?.providerId || "-",
    }),
    [user]
  );

  useEffect(() => {
    if (!showDeleteConfirmModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [showDeleteConfirmModal]);

  const handleUpdateName = async (e) => {
    e.preventDefault();

    const targetName = displayName.trim();
    const currentName = (user?.displayName || "").trim();

    if (!targetName) {
      toast.error("Ingresa un nombre");
      return;
    }

    if (targetName === currentName) {
      toast.error("El nombre es igual al actual");
      return;
    }

    setNameLoading(true);
    try {
      await updateUserDisplayName(targetName);
      toast.success("Nombre actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar el nombre"));
    } finally {
      setNameLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    const currentEmail = user?.email || "";
    const targetEmail = newEmail.trim().toLowerCase();

    if (!targetEmail) {
      toast.error("Ingresa el nuevo correo");
      return;
    }

    if (targetEmail === currentEmail.toLowerCase()) {
      toast.error("El nuevo correo es igual al actual");
      return;
    }

    if (!emailPassword.trim()) {
      toast.error("Ingresa tu contrasena actual");
      return;
    }

    setEmailLoading(true);
    try {
      await updateUserEmail(targetEmail, emailPassword);
      toast.success("Correo actualizado correctamente");
      setNewEmail("");
      setEmailPassword("");
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar el correo"));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("Ingresa tu contrasena actual");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La nueva contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("La nueva contrasena debe ser distinta");
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success("Contrasena actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar la contrasena"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();

    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINAR") {
      toast.error("Escribe ELIMINAR para confirmar");
      return;
    }

    if (!deletePassword.trim()) {
      toast.error("Ingresa tu contrasena actual");
      return;
    }

    setShowDeleteConfirmModal(true);
  };

  const executeDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const result = await deleteUserAccount(deletePassword);
      if (result?.dataCleanupError) {
        toast.success("Cuenta eliminada. Algunos datos no se pudieron limpiar automaticamente.");
      } else {
        toast.success("Cuenta eliminada");
      }
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error, "No se pudo eliminar la cuenta"));
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#d9e6ff] bg-[#f8fbff] p-4">
        <p className="text-sm text-gray-500">Cuenta activa</p>
        <p className="text-lg font-semibold text-[#0a2b6e] break-all">{user?.email || "-"}</p>
        <p className="text-sm text-gray-500 mt-1">{user?.displayName || "Sin nombre"}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <form onSubmit={handleUpdateName} className="border border-[#e4edff] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-[#0a2b6e] flex items-center gap-2">
            <UserRound size={16} />
            Nombre de perfil
          </h3>
          <input
            type="text"
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <button
            type="submit"
            disabled={nameLoading}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {nameLoading ? "Guardando..." : "Actualizar nombre"}
          </button>
        </form>

        <form onSubmit={handleUpdateEmail} className="border border-[#e4edff] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-[#0a2b6e]">Cambiar correo</h3>
          <input
            type="email"
            placeholder="Nuevo correo"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="password"
            placeholder="Contrasena actual"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <button
            type="submit"
            disabled={emailLoading}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {emailLoading ? "Actualizando..." : "Actualizar correo"}
          </button>
        </form>

        <form
          onSubmit={handleUpdatePassword}
          className="border border-[#e4edff] rounded-xl p-4 space-y-3"
        >
          <h3 className="font-semibold text-[#0a2b6e]">Cambiar contrasena</h3>
          <input
            type="password"
            placeholder="Contrasena actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="password"
            placeholder="Nueva contrasena"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="password"
            placeholder="Confirmar nueva contrasena"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-[#1f67ff] hover:bg-[#0a2b6e] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {passwordLoading ? "Actualizando..." : "Actualizar contrasena"}
          </button>
        </form>

        <div className="border border-[#e4edff] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-[#0a2b6e]">Seguridad de la cuenta</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium text-gray-800">Creada:</span> {securityInfo.createdAt}
            </p>
            <p>
              <span className="font-medium text-gray-800">Ultimo acceso:</span> {securityInfo.lastSignInAt}
            </p>
            <p>
              <span className="font-medium text-gray-800">Metodo de acceso:</span> {securityInfo.provider}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleDeleteAccount} className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
        <h3 className="font-semibold text-red-700 flex items-center gap-2">
          <ShieldAlert size={16} />
          Zona de peligro
        </h3>
        <p className="text-sm text-red-700">
          Esta accion elimina tu cuenta y todos tus datos (transacciones, categorias y metodos de
          pago). Escribe <strong>ELIMINAR</strong> para confirmar.
        </p>
        <input
          type="text"
          placeholder="Escribe ELIMINAR"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          className="w-full border border-red-300 rounded-lg p-2"
          required
        />
        <input
          type="password"
          placeholder="Contrasena actual"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="w-full border border-red-300 rounded-lg p-2"
          required
        />
        <button
          type="submit"
          disabled={deleteLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
        >
          <Trash2 size={16} />
          {deleteLoading ? "Eliminando..." : "Eliminar cuenta"}
        </button>
      </form>

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-red-100 p-5 space-y-4">
            <h4 className="text-lg font-semibold text-red-700">Confirmar eliminacion de cuenta</h4>
            <p className="text-sm text-gray-700">
              Vas a eliminar tu cuenta y todos tus datos. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Eliminando..." : "Si, eliminar todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySettings({ categories, addCategory, editCategory, deleteCategory }) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("gasto");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("gasto");

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Escribe una categoria");
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

  const expenseCategories = categories.filter((item) => item.type === "gasto");
  const incomeCategories = categories.filter((item) => item.type === "ingreso");

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#0a2b6e]">Categorias ({categories.length})</h3>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoria"
          className="flex-1 border rounded-lg p-3"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="border rounded-lg p-3 md:w-44"
        >
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-[#0a2b6e] hover:bg-[#081f52] text-white px-6 py-3 rounded-lg"
        >
          Agregar
        </button>
      </div>

      <CategoryList
        title="Categorias de gasto"
        items={expenseCategories}
        editingId={editingId}
        editName={editName}
        editType={editType}
        setEditName={setEditName}
        setEditType={setEditType}
        setEditingId={setEditingId}
        onSave={handleSave}
        onDelete={deleteCategory}
      />

      <CategoryList
        title="Categorias de ingreso"
        items={incomeCategories}
        editingId={editingId}
        editName={editName}
        editType={editType}
        setEditName={setEditName}
        setEditType={setEditType}
        setEditingId={setEditingId}
        onSave={handleSave}
        onDelete={deleteCategory}
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
    <div>
      <h4 className="font-semibold mb-2 text-gray-700">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Sin registros</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between p-3 gap-3">
              {editingId === item.id ? (
                <div className="flex-1 flex flex-col md:flex-row gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="border rounded-lg px-3 py-2 md:w-36"
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === item.id ? (
                  <button
                    type="button"
                    onClick={() => onSave(item.id)}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                      setEditType(item.type || "gasto");
                    }}
                    className="p-2 rounded-lg bg-[#e9f2ff] hover:bg-[#d9ecff] text-[#0a2b6e]"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
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

function PaymentSettings({ methods, addMethod, editMethod, deleteMethod }) {
  const [newMethod, setNewMethod] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    if (!newMethod.trim()) {
      toast.error("Escribe un metodo");
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

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-[#0a2b6e]">Metodos de pago ({methods.length})</h3>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          placeholder="Nuevo metodo de pago"
          className="flex-1 border rounded-lg p-3"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-[#0a2b6e] hover:bg-[#081f52] text-white px-6 py-3 rounded-lg"
        >
          Agregar
        </button>
      </div>

      {methods.length === 0 ? (
        <p className="text-sm text-gray-400">Sin metodos registrados</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {methods.map((method) => (
            <li key={method.id} className="flex items-center justify-between p-3 gap-3">
              {editingId === method.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2"
                />
              ) : (
                <span className="font-medium text-gray-800">{method.name}</span>
              )}

              <div className="flex items-center gap-2">
                {editingId === method.id ? (
                  <button
                    type="button"
                    onClick={() => handleSave(method.id)}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    Guardar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(method.id);
                      setEditName(method.name);
                    }}
                    className="p-2 rounded-lg bg-[#e9f2ff] hover:bg-[#d9ecff] text-[#0a2b6e]"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteMethod(method.id)}
                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
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
