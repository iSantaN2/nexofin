import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import { logError } from "../services/logger";

export default function Login() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Sesion iniciada");
      navigate(from, { replace: true });
    } catch (error) {
      logError("No se pudo iniciar sesion", error, {
        source: "auth.login",
      });
      toast.error("Credenciales invalidas o usuario no registrado");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverPassword = async () => {
    const targetEmail = recoverEmail.trim() || email.trim();

    if (!targetEmail) {
      toast.error("Ingresa tu correo para recuperar la contrasena");
      return;
    }

    setRecoverLoading(true);
    try {
      await resetPassword(targetEmail);
      toast.success("Te enviamos un enlace de recuperacion al correo");
      setShowRecover(false);
      setRecoverEmail("");
    } catch (error) {
      logError("No se pudo enviar el enlace de recuperacion", error, {
        source: "auth.reset-password",
      });
      toast.error("No se pudo enviar el enlace. Verifica el correo");
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesion"
      subtitle="Ingresa a tu panel para revisar tu balance, metas, reportes y alertas financieras."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          required
        />
        <input
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          required
        />

        <Button type="submit" disabled={loading} variant="brand" size="lg" className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setRecoverEmail(email);
            setShowRecover((value) => !value);
          }}
          className="text-sm font-medium text-[#1f67ff] hover:text-[#0a2b6e]"
        >
          Olvide mi contrasena
        </button>

        {showRecover && (
          <div className="mt-3 space-y-2 rounded-2xl border border-[#d9ecff] bg-[#eff8ff] p-3">
            <p className="text-sm text-gray-600">Te enviaremos un enlace de recuperacion</p>
            <input
              type="email"
              placeholder="Correo de recuperacion"
              value={recoverEmail}
              onChange={(e) => setRecoverEmail(e.target.value)}
              className="w-full"
            />
            <Button
              type="button"
              onClick={handleRecoverPassword}
              disabled={recoverLoading}
              variant="primary"
              className="w-full"
            >
              {recoverLoading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-600">
        No tienes cuenta?{" "}
        <Link to="/register" className="font-medium text-[#1f67ff] hover:text-[#0a2b6e]">
          Crea una
        </Link>
      </p>
    </AuthShell>
  );
}
