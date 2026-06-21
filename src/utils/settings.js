export const settingsInputClass =
  "min-h-12 w-full rounded-2xl border border-[#d6e4f7] bg-white px-4 py-3 text-[#06142e] outline-none transition placeholder:text-slate-400 focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10";

export function getAuthErrorMessage(error, fallback) {
  const cleanupDetail =
    typeof error?.cleanupMessage === "string" ? error.cleanupMessage.trim() : "";

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
    case "firestore/account-cleanup-failed":
      if (cleanupDetail) {
        if (cleanupDetail.includes("categories")) {
          return "No se pudo completar la limpieza de categorias al eliminar la cuenta.";
        }
        if (cleanupDetail.includes("paymentMethods")) {
          return "No se pudo completar la limpieza de metodos de pago al eliminar la cuenta.";
        }
        if (cleanupDetail.includes("budgets")) {
          return "No se pudo completar la limpieza de metas al eliminar la cuenta.";
        }
        if (cleanupDetail.includes("notifications")) {
          return "No se pudo completar la limpieza de alertas al eliminar la cuenta.";
        }
        if (cleanupDetail.includes("notificationSettings")) {
          return "No se pudieron borrar las preferencias de notificaciones al eliminar la cuenta.";
        }
        if (cleanupDetail.includes("users")) {
          return "No se pudo borrar el perfil principal de la cuenta.";
        }
      }
      return "No eliminamos tu cuenta porque no se pudieron borrar todos tus datos. Intenta de nuevo o contacta soporte.";
    case "auth/delete-account-failed":
      return "Se limpiaron datos locales, pero Firebase no termino de cerrar la cuenta. Cierra sesion e intentalo otra vez.";
    case "auth/reauth-timeout":
      return "La reautenticacion tardo demasiado. Vuelve a iniciar sesion e intentalo otra vez.";
    case "firestore/account-cleanup-timeout":
      return "La limpieza de datos tardo demasiado. Intentalo otra vez con una conexion estable.";
    case "auth/token-timeout":
      return "No se pudo renovar la sesion para eliminar la cuenta. Intentalo otra vez.";
    case "auth/delete-timeout":
      return "Firebase tardo demasiado en eliminar la cuenta. Intentalo otra vez.";
    case "auth/signout-timeout":
      return "La cuenta se proceso, pero el cierre de sesion tardo demasiado. Recarga la app.";
    case "permission-denied":
      return "No tienes permisos para borrar algunos datos en Firestore.";
    default:
      return fallback;
  }
}

export function formatAuthDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
