import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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
      console.error(error);
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
      console.error(error);
      toast.error("No se pudo enviar el enlace. Verifica el correo");
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#d9e6ff] shadow-lg rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <img src="/nexofin-logo.png" alt="NexoFin" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
            NexoFin
          </h1>
        </div>

        <h2 className="text-xl font-semibold text-[#0a2b6e] mb-1">Iniciar sesion</h2>
        <p className="text-sm text-gray-500 mb-5">Ingresa para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setRecoverEmail(email);
              setShowRecover((v) => !v);
            }}
            className="text-sm text-[#1f67ff] hover:text-[#0a2b6e] font-medium"
          >
            Olvide mi contrasena
          </button>

          {showRecover && (
            <div className="mt-3 p-3 bg-[#eff8ff] border border-[#d9ecff] rounded-lg space-y-2">
              <p className="text-sm text-gray-600">Te enviaremos un enlace de recuperacion</p>
              <input
                type="email"
                placeholder="Correo de recuperacion"
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
              <button
                type="button"
                onClick={handleRecoverPassword}
                disabled={recoverLoading}
                className="w-full bg-[#1f67ff] hover:bg-[#0a2b6e] text-white py-2 rounded-lg disabled:opacity-60"
              >
                {recoverLoading ? "Enviando..." : "Enviar enlace"}
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-4">
          No tienes cuenta?{" "}
          <Link to="/register" className="text-[#1f67ff] hover:text-[#0a2b6e] font-medium">
            Crea una
          </Link>
        </p>
      </div>
    </div>
  );
}
