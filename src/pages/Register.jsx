import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const result = await register(email.trim(), password);
      if (result?.verificationEmailSent) {
        toast.success("Cuenta creada. Revisa tu correo para verificarla.");
      } else {
        toast.success("Cuenta creada. Enviaremos verificacion desde la pantalla siguiente.");
      }
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear la cuenta. Verifica el correo");
    } finally {
      setLoading(false);
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

        <h2 className="text-xl font-semibold text-[#0a2b6e] mb-1">Crear cuenta</h2>
        <p className="text-sm text-gray-500 mb-5">Registra tus datos</p>

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
          <input
            type="password"
            placeholder="Confirmar contrasena"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Ya tienes cuenta?{" "}
          <Link to="/login" className="text-[#1f67ff] hover:text-[#0a2b6e] font-medium">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
