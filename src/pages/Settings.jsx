import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  Pencil,
  PlusCircle,
  Trash2,
  UserCircle2,
  LayoutGrid,
  WalletCards,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  BellRing,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import { useAuth } from "../context/AuthContext";
import { AppContext } from "../context/AppContext";
import Button from "../components/ui/Button";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/ui/PageHeader";
import SectionPanel from "../components/ui/SectionPanel";

const TABS = [
  {
    key: "profile",
    label: "Perfil",
    description: "Cuenta, correo y seguridad",
    icon: UserCircle2,
  },
  {
    key: "categories",
    label: "Categorías",
    description: "Ingresos y gastos",
    icon: LayoutGrid,
  },
  {
    key: "methods",
    label: "Métodos de pago",
    description: "Efectivo, tarjetas y billeteras",
    icon: WalletCards,
  },
  {
    key: "notifications",
    label: "Notificaciones",
    description: "Alertas financieras",
    icon: BellRing,
  },
];

function getAuthErrorMessage(error, fallback) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "La contraseña actual es incorrecta.";
    case "auth/requires-recent-login":
      return "Por seguridad, vuelve a iniciar sesión e inténtalo otra vez.";
    case "auth/email-already-in-use":
      return "Ese correo ya está en uso por otra cuenta.";
    case "auth/invalid-email":
      return "El correo no tiene un formato válido.";
    case "auth/weak-password":
      return "La nueva contraseña es muy débil.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
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

const settingsInputClass =
  "min-h-12 w-full rounded-2xl border border-[#d6e4f7] bg-white px-4 py-3 text-[#06142e] outline-none transition placeholder:text-slate-400 focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10";

function SettingsCard({ title, description, icon: Icon, children, tone = "default", className = "" }) {
  const isDanger = tone === "danger";

  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-sm ${
        isDanger
          ? "border-red-200 bg-gradient-to-br from-white to-red-50/80"
          : "border-[#dbe8ff] bg-white"
      } ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        {Icon ? (
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDanger
                ? "bg-red-100 text-red-600"
                : "bg-gradient-to-br from-[#e9f2ff] to-[#e9fff8] text-[#0a2b6e]"
            }`}
          >
            <Icon size={20} />
          </span>
        ) : null}
        <div>
          <h3 className={`font-bold ${isDanger ? "text-red-700" : "text-[#06142e]"}`}>
            {title}
          </h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#cfe0fb] bg-[#f8fbff] p-6 text-center">
      <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0a2b6e] shadow-sm">
        <Icon size={20} />
      </span>
      <p className="font-bold text-[#06142e]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { notificationSettings, updateNotificationSettings } = useContext(AppContext);
  const { categories, addCategory, editCategory, deleteCategory } = useCategories();
  const { methods, addMethod, editMethod, deleteMethod } = usePaymentMethods();
  const { user, updateUserDisplayName, updateUserEmail, updateUserPassword, deleteUserAccount } =
    useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes"
        description="Gestiona perfil, categorías, métodos de pago y notificaciones."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#dbe8ff] bg-gradient-to-br from-[#061a3d] via-[#0a2b6e] to-[#123f93] p-5 text-white shadow-[0_22px_55px_rgba(10,43,110,0.18)]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#11c69a]/25 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/70">Cuenta activa</p>
              <h2 className="mt-1 break-all text-2xl font-bold">{user?.email || "-"}</h2>
              <p className="mt-1 text-sm text-white/70">
                {user?.displayName || "Sin nombre"} · Configuración protegida
              </p>
            </div>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-2xl font-bold ring-1 ring-white/20">
              {(user?.displayName || user?.email || "N").charAt(0).toUpperCase()}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Categorías</p>
            <p className="mt-1 text-2xl font-bold text-[#0a2b6e]">{categories.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Métodos</p>
            <p className="mt-1 text-2xl font-bold text-[#0a2b6e]">{methods.length}</p>
          </div>
          <div className="col-span-2 rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Alertas activas</p>
            <p className="mt-1 text-2xl font-bold text-[#11a987]">
              {
                [
                  notificationSettings?.budget80Enabled,
                  notificationSettings?.budget100Enabled,
                  notificationSettings?.dailyReminderEnabled,
                ].filter(Boolean).length
              }{" "}
              / 3
            </p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TABS.map(({ key, label, description, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={() => setActiveTab(key)}
            className={`group flex min-h-24 items-start gap-3 rounded-[1.5rem] border p-4 text-left transition ${
              activeTab === key
                ? "border-[#1f67ff] bg-gradient-to-br from-[#0a2b6e] to-[#1f67ff] text-white shadow-[0_18px_38px_rgba(31,103,255,0.22)]"
                : "border-[#dbe8ff] bg-white text-[#0a2b6e] shadow-sm hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(10,43,110,0.08)]"
            }`}
          >
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                activeTab === key ? "bg-white/15" : "bg-[#eff8ff] group-hover:bg-[#e3f2ff]"
              }`}
            >
              <Icon size={18} />
            </span>
            <span>
              <span className="block font-bold">{label}</span>
              <span className={`mt-1 block text-sm ${activeTab === key ? "text-white/75" : "text-slate-500"}`}>
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>

      <SectionPanel>
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

        {activeTab === "notifications" && (
          <NotificationSettings
            notificationSettings={notificationSettings}
            updateNotificationSettings={updateNotificationSettings}
          />
        )}
      </SectionPanel>
    </div>
  );
}

function NotificationSettings({ notificationSettings, updateNotificationSettings }) {
  const [savingKey, setSavingKey] = useState("");

  const toggles = [
    {
      key: "budget80Enabled",
      title: "Alerta al 80% de meta",
      description:
        "Muestra aviso cuando una categoría de gasto llega al 80% de su meta mensual.",
      icon: Bell,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      key: "budget100Enabled",
      title: "Alerta al 100% de meta",
      description:
        "Muestra aviso cuando una categoría llega o supera el 100% de su meta mensual.",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
    },
    {
      key: "dailyReminderEnabled",
      title: "Recordatorio diario",
      description:
        "Muestra aviso una vez al día cuando aún no registraste movimientos hoy.",
      icon: CheckCircle2,
      tone: "text-[#0a2b6e] bg-[#e9f2ff]",
    },
  ];

  const handleToggle = (keyName) => {
    const currentValue = !!notificationSettings?.[keyName];
    setSavingKey(keyName);
    updateNotificationSettings({ [keyName]: !currentValue });
    setTimeout(() => {
      setSavingKey("");
    }, 250);
    toast.success("Preferencia de notificación actualizada");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f67ff]">Centro de alertas</p>
        <h3 className="mt-2 text-xl font-bold text-[#06142e]">Notificaciones financieras</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Elige qué señales debe vigilar NexoFin para ayudarte antes de que un gasto se salga de control.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {toggles.map((toggle) => {
          const enabled = !!notificationSettings?.[toggle.key];
          const isSaving = savingKey === toggle.key;
          const Icon = toggle.icon;

          return (
            <div
              key={toggle.key}
              className={`rounded-[1.5rem] border p-4 shadow-sm transition ${
                enabled
                  ? "border-[#11c69a]/35 bg-[#f4fffb]"
                  : "border-[#dbe8ff] bg-white"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toggle.tone}`}>
                  <Icon size={19} />
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {enabled ? "Activa" : "Pausada"}
                </span>
              </div>

              <div className="min-h-24">
                <p className="font-bold text-[#06142e]">{toggle.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{toggle.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(toggle.key)}
                disabled={isSaving}
                className={`relative mt-4 inline-flex h-8 w-14 shrink-0 rounded-full border transition ${
                  enabled
                    ? "bg-[#12c59a] border-[#12c59a]"
                    : "bg-gray-200 border-gray-300"
                } ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
                aria-pressed={enabled}
                aria-label={toggle.title}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                    enabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
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
          ? "Correo y contraseña"
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
      toast.error("Ingresa tu contraseña actual");
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
      toast.error("Ingresa tu contraseña actual");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("La nueva contraseña debe ser distinta");
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar la contraseña"));
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
      toast.error("Ingresa tu contraseña actual");
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
      <div className="relative overflow-hidden rounded-[2rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#11c69a]/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0a2b6e] to-[#1f67ff] text-2xl font-bold text-white shadow-lg">
              {(user?.displayName || user?.email || "N").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-slate-500">Cuenta activa</p>
              <p className="break-all text-lg font-bold text-[#0a2b6e]">{user?.email || "-"}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.displayName || "Sin nombre"}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={16} />
            Sesión protegida
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SettingsCard
          title="Nombre de perfil"
          description="Este nombre se muestra dentro de tu experiencia NexoFin."
          icon={UserRound}
        >
          <form onSubmit={handleUpdateName} className="space-y-3">
          <input
            type="text"
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={settingsInputClass}
            required
          />
          <Button
            type="submit"
            disabled={nameLoading}
            variant="primary"
            className="w-full"
          >
            {nameLoading ? "Guardando..." : "Actualizar nombre"}
          </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Cambiar correo"
          description="Requiere tu contraseña actual para confirmar que eres tú."
          icon={Mail}
        >
          <form onSubmit={handleUpdateEmail} className="space-y-3">
          <input
            type="email"
            placeholder="Nuevo correo"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={settingsInputClass}
            required
          />
          <input
            type="password"
            placeholder="Contraseña actual"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            className={settingsInputClass}
            required
          />
          <Button
            type="submit"
            disabled={emailLoading}
            variant="primary"
            className="w-full"
          >
            {emailLoading ? "Actualizando..." : "Actualizar correo"}
          </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Cambiar contraseña"
          description="Usa una contraseña distinta y de al menos 6 caracteres."
          icon={KeyRound}
        >
          <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={settingsInputClass}
            required
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={settingsInputClass}
            required
          />
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={settingsInputClass}
            required
          />
          <Button
            type="submit"
            disabled={passwordLoading}
            variant="brand"
            className="w-full"
          >
            {passwordLoading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Seguridad de la cuenta"
          description="Información de autenticación y últimos accesos."
          icon={ShieldCheck}
        >
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Creada</span>
              <span className="font-semibold text-[#06142e]">{securityInfo.createdAt}</span>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Último acceso</span>
              <span className="font-semibold text-[#06142e]">{securityInfo.lastSignInAt}</span>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Método de acceso</span>
              <span className="font-semibold text-[#06142e]">{securityInfo.provider}</span>
            </div>
          </div>
        </SettingsCard>
      </div>

      <SettingsCard
        title="Zona de peligro"
        description="Acciones irreversibles sobre tu cuenta y tus datos."
        icon={ShieldAlert}
        tone="danger"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-3">
        <p className="text-sm text-red-700">
          Esta acción elimina tu cuenta y todos tus datos: transacciones, categorías, métodos de pago,
          metas y alertas. Escribe <strong>ELIMINAR</strong> para confirmar.
        </p>
        <input
          type="text"
          placeholder="Escribe ELIMINAR"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          className={`${settingsInputClass} border-red-200 focus:border-red-400 focus:ring-red-100`}
          required
        />
        <input
          type="password"
          placeholder="Contraseña actual"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className={`${settingsInputClass} border-red-200 focus:border-red-400 focus:ring-red-100`}
          required
        />
        <Button
          type="submit"
          disabled={deleteLoading}
          variant="danger"
          className="w-full sm:w-auto"
        >
          <Trash2 size={16} />
          {deleteLoading ? "Eliminando..." : "Eliminar cuenta"}
        </Button>
        </form>
      </SettingsCard>

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-[2rem] border border-red-100 bg-white p-5 shadow-[0_28px_70px_rgba(127,29,29,0.24)] sm:rounded-[1.75rem]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-4 flex items-start gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <ShieldAlert size={22} />
              </span>
              <div>
                <h4 className="text-lg font-bold text-red-700">Confirmar eliminación de cuenta</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Vas a eliminar tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              Si confirmas, NexoFin intentará limpiar tus datos y cerrará la sesión automáticamente.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="neutral"
                className="w-full sm:w-auto"
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full sm:w-auto"
                onClick={executeDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Sí, eliminar todo"}
              </Button>
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
          variant="primary"
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

function PaymentSettings({ methods, addMethod, editMethod, deleteMethod }) {
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
          variant="primary"
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
