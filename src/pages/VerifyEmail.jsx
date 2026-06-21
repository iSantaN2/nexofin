import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import { logError } from "../services/logger";

function getVerificationErrorMessage(error) {
  switch (error?.code) {
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e intentalo otra vez.";
    default:
      return "No se pudo completar la accion. Intentalo nuevamente.";
  }
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, logout, resendVerificationEmail, refreshCurrentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const email = useMemo(() => user?.email || "", [user?.email]);

  useEffect(() => {
    if (user?.emailVerified) {
      navigate("/", { replace: true });
    }
  }, [user?.emailVerified, navigate]);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast.success("Te enviamos otro correo de verificacion");
    } catch (error) {
      logError("No se pudo reenviar el correo de verificacion", error, {
        source: "auth.verify-email-resend",
      });
      toast.error(getVerificationErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const currentUser = await refreshCurrentUser();
      if (currentUser?.emailVerified) {
        toast.success("Correo verificado. Bienvenido.");
        navigate("/", { replace: true });
      } else {
        toast.error("Tu correo aun no esta verificado");
      }
    } catch (error) {
      logError("No se pudo validar el estado del correo", error, {
        source: "auth.verify-email-refresh",
      });
      toast.error(getVerificationErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      logError("No se pudo cerrar sesion desde verify email", error, {
        source: "auth.verify-email-logout",
      });
      toast.error("No se pudo cerrar sesion");
    }
  };

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Confirma tu cuenta para proteger tus datos y activar tu panel financiero."
    >
      <div className="rounded-2xl border border-[#d9e6ff] bg-[#f8fbff] p-4">
        <p className="text-sm text-gray-600">
          Enviamos un enlace de verificacion a{" "}
          <span className="font-semibold text-[#0a2b6e]">{email}</span>.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Abre ese correo, confirma tu cuenta y luego presiona "Ya verifique mi correo".
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleCheckStatus}
          disabled={checking}
          variant="brand"
          className="w-full"
        >
          {checking ? "Validando..." : "Ya verifique mi correo"}
        </Button>

        <Button
          type="button"
          onClick={handleResend}
          disabled={sending}
          variant="soft"
          className="w-full"
        >
          {sending ? "Enviando..." : "Reenviar correo de verificacion"}
        </Button>

        <Button
          type="button"
          onClick={handleLogout}
          variant="neutral"
          className="w-full"
        >
          Cerrar sesion
        </Button>
      </div>
    </AuthShell>
  );
}
