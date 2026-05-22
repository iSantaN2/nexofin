import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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
        toast.error("Tu correo aun no esta verificado");
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
      toast.error("No se pudo cerrar sesion");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#d9e6ff] shadow-lg rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <img src="/nexofin-logo.png" alt="NexoFin" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
            NexoFin
          </h1>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#0a2b6e]">Verifica tu correo</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enviamos un enlace de verificacion a <span className="font-medium">{email}</span>.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Abre ese correo, confirma tu cuenta y luego presiona "Ya verifique mi correo".
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {checking ? "Validando..." : "Ya verifique mi correo"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="w-full bg-[#eff8ff] hover:bg-[#e3f2ff] text-[#0a2b6e] py-2 rounded-lg disabled:opacity-60"
          >
            {sending ? "Enviando..." : "Reenviar correo de verificacion"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}
