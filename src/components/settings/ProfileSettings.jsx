import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  KeyRound,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { logError } from "../../services/logger";
import {
  formatAuthDate,
  getAuthErrorMessage,
  settingsInputClass,
} from "../../utils/settings";
import { getUserAlias, getUserInitial, getUserPhotoUrl } from "../../utils/profile";
import { validateProfilePhotoFile } from "../../utils/imageUpload";
import { SettingsCard } from "./SettingsPrimitives";

export default function ProfileSettings({
  user,
  userProfile,
  updateUserProfileDetails,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
}) {
  const navigate = useNavigate();
  const [alias, setAlias] = useState(userProfile?.alias || user?.displayName || "");
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [firstName, setFirstName] = useState(userProfile?.firstName || "");
  const [lastName, setLastName] = useState(userProfile?.lastName || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [address, setAddress] = useState(userProfile?.address || "");
  const [profileLoading, setProfileLoading] = useState(false);

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

  const userAlias = getUserAlias(user, userProfile);
  const userInitial = getUserInitial(user, userProfile);
  const userPhoto = getUserPhotoUrl(user, userProfile);
  const visiblePhoto = photoPreviewUrl || (!removePhoto ? userPhoto : "");

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
    setAlias(userProfile?.alias || user?.displayName || "");
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl("");
    setRemovePhoto(false);
    setFirstName(userProfile?.firstName || "");
    setLastName(userProfile?.lastName || "");
    setPhone(userProfile?.phone || "");
    setAddress(userProfile?.address || "");
  }, [user, userProfile]);

  useEffect(() => {
    if (!selectedPhotoFile) return undefined;

    const objectUrl = URL.createObjectURL(selectedPhotoFile);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPhotoFile]);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!alias.trim()) {
      toast.error("Ingresa el alias que se vera dentro de NexoFin");
      return;
    }

    setProfileLoading(true);
    try {
      await updateUserProfileDetails({
        alias,
        photoFile: selectedPhotoFile,
        removePhoto,
        firstName,
        lastName,
        phone,
        address,
      });
      toast.success("Perfil actualizado correctamente");
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl("");
      setRemovePhoto(false);
    } catch (error) {
      logError("No se pudo actualizar el perfil", error, {
        source: "settings.profile-update-details",
      });
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar el perfil"));
    } finally {
      setProfileLoading(false);
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
      toast.success("Te enviamos un enlace de verificacion al nuevo correo");
      setNewEmail("");
      setEmailPassword("");
    } catch (error) {
      logError("No se pudo actualizar el correo", error, {
        source: "settings.profile-update-email",
      });
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar el correo"));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("La nueva contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
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
      logError("No se pudo actualizar la contrasena", error, {
        source: "settings.profile-update-password",
      });
      toast.error(getAuthErrorMessage(error, "No se pudo actualizar la contrasena"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
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
      await deleteUserAccount(deletePassword);
      toast.success("Cuenta eliminada correctamente");
      navigate("/login", { replace: true });
    } catch (error) {
      logError("No se pudo eliminar la cuenta", error, {
        source: "settings.profile-delete-account",
      });
      toast.error(getAuthErrorMessage(error, "No se pudo eliminar la cuenta"));
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }

    setSelectedPhotoFile(file);
    setRemovePhoto(false);
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl("");
    setRemovePhoto(true);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-[#11c69a]/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={`Foto de ${userAlias}`}
                className="h-16 w-16 rounded-3xl object-cover shadow-lg ring-1 ring-[#dbe8ff]"
              />
            ) : (
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0a2b6e] to-[#1f67ff] text-2xl font-bold text-white shadow-lg">
                {userInitial}
              </span>
            )}
            <div>
              <p className="text-sm text-slate-500">Cuenta activa</p>
              <p className="text-lg font-bold text-[#0a2b6e]">{userAlias}</p>
              <p className="mt-1 break-all text-sm text-slate-500">{user?.email || "-"}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={16} />
            Sesion protegida
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsCard
          title="Identidad visible"
          description="Este alias y esta foto representan tu cuenta dentro de NexoFin."
          icon={UserRound}
        >
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#dbe8ff] bg-[#f8fbff] p-4 sm:flex-row sm:items-center">
              {visiblePhoto ? (
                <img
                  src={visiblePhoto}
                  alt={`Vista previa de ${alias.trim() || userAlias}`}
                  className="h-20 w-20 rounded-3xl object-cover shadow-sm ring-1 ring-[#dbe8ff]"
                />
              ) : (
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0a2b6e] to-[#1f67ff] text-3xl font-bold text-white shadow-sm">
                  {(alias.trim() || userInitial).charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#dbe8ff] bg-white px-4 py-2 text-sm font-semibold text-[#0a2b6e] shadow-sm transition hover:bg-[#eff8ff]">
                  <Camera size={16} />
                  {visiblePhoto ? "Cambiar foto" : "Subir foto"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelection}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {visiblePhoto ? (
                    <Button type="button" variant="soft" onClick={handleRemovePhoto}>
                      Quitar foto
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  Usa JPG, PNG o WEBP. El limite es 3 MB y NexoFin optimizara la imagen antes de
                  guardarla.
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Alias visible"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className={settingsInputClass}
              required
            />
            <Button type="submit" disabled={profileLoading} variant="brand" className="w-full">
              <Camera size={16} />
              {profileLoading ? "Guardando..." : "Guardar identidad"}
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Datos personales"
          description="Completa estos datos despues. No son obligatorios para usar NexoFin."
          icon={UserRound}
        >
          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nombres"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={settingsInputClass}
              />
              <input
                type="text"
                placeholder="Apellidos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={settingsInputClass}
              />
            </div>
            <input
              type="tel"
              placeholder="Numero de celular"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={settingsInputClass}
            />
            <textarea
              rows={3}
              placeholder="Direccion"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${settingsInputClass} resize-none py-3`}
            />
            <Button type="submit" disabled={profileLoading} variant="brand" className="w-full">
              {profileLoading ? "Guardando..." : "Guardar datos personales"}
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Cambiar correo"
          description="Requiere tu contrasena actual para confirmar que eres tu."
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
              placeholder="Contrasena actual"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className={settingsInputClass}
              required
            />
            <Button type="submit" disabled={emailLoading} variant="brand" className="w-full">
              {emailLoading ? "Actualizando..." : "Actualizar correo"}
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Cambiar contrasena"
          description="Usa una contrasena distinta y de al menos 6 caracteres."
          icon={KeyRound}
        >
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Contrasena actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={settingsInputClass}
              required
            />
            <input
              type="password"
              placeholder="Nueva contrasena"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={settingsInputClass}
              required
            />
            <input
              type="password"
              placeholder="Confirmar nueva contrasena"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={settingsInputClass}
              required
            />
            <Button type="submit" disabled={passwordLoading} variant="brand" className="w-full">
              {passwordLoading ? "Actualizando..." : "Actualizar contrasena"}
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Seguridad de la cuenta"
          description="Informacion de autenticacion y ultimos accesos."
          icon={ShieldCheck}
          className="xl:col-span-2"
        >
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Creada
              </span>
              <span className="font-semibold text-[#06142e]">{securityInfo.createdAt}</span>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ultimo acceso
              </span>
              <span className="font-semibold text-[#06142e]">{securityInfo.lastSignInAt}</span>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Metodo de acceso
              </span>
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
            Esta accion elimina tu cuenta y todos tus datos: transacciones, categorias, metodos de
            pago, metas y alertas. Escribe <strong>ELIMINAR</strong> para confirmar.
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
            placeholder="Contrasena actual"
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
                <h4 className="text-lg font-bold text-red-700">Confirmar eliminacion de cuenta</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Vas a eliminar tu cuenta y todos tus datos. Esta accion no se puede deshacer.
                </p>
              </div>
            </div>
            <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              Si confirmas, NexoFin intentara limpiar tus datos y cerrara la sesion automaticamente.
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
                {deleteLoading ? "Eliminando..." : "Si, eliminar todo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
