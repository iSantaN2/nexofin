import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";

function getVerificationErrorMessage(error) {
  switch (error?.code) {
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo otra vez.";
    default:
      return "No se pudo completar la acción. Inténtalo nuevamente.";
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
      toast.success("Te enviamos otro correo de verificación");
    } catch (error) {
      console.error(error);
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
        toast.error("Tu correo aún no está verificado");
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
      toast.error("No se pudo cerrar sesión");
    }
  };

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Confirma tu cuenta para proteger tus datos y activar tu panel financiero."
    >
      <div className="rounded-2xl border border-[#d9e6ff] bg-[#f8fbff] p-4">
        <p className="text-sm text-gray-600">
          Enviamos un enlace de verificación a <span className="font-semibold text-[#0a2b6e]">{email}</span>.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Abre ese correo, confirma tu cuenta y luego presiona "Ya verifiqué mi correo".
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
            {checking ? "Validando..." : "Ya verifiqué mi correo"}
          </Button>

          <Button
            type="button"
            onClick={handleResend}
            disabled={sending}
            variant="soft"
            className="w-full"
          >
            {sending ? "Enviando..." : "Reenviar correo de verificación"}
          </Button>

          <Button
            type="button"
            onClick={handleLogout}
            variant="neutral"
            className="w-full"
          >
            Cerrar sesión
          </Button>
        </div>
    </AuthShell>
  );
}
