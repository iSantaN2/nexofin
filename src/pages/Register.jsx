import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import { logError } from "../services/logger";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [alias, setAlias] = useState("");
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

    if (!alias.trim()) {
      toast.error("Ingresa el alias que veras dentro de NexoFin");
      return;
    }

    setLoading(true);
    try {
      const result = await register(email.trim(), password, { alias });
      if (result?.verificationEmailSent) {
        toast.success("Cuenta creada. Revisa tu correo para verificarla.");
      } else {
        toast.success("Cuenta creada. Enviaremos verificacion desde la pantalla siguiente.");
      }
      navigate("/", { replace: true });
    } catch (error) {
      logError("No se pudo crear la cuenta", error, {
        source: "auth.register",
      });
      toast.error("No se pudo crear la cuenta. Verifica el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Crea tu acceso en segundos. Luego configuraras tu moneda y el resto de tu perfil dentro de la app."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Alias visible"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="w-full"
          required
        />
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
        <input
          type="password"
          placeholder="Confirmar contrasena"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full"
          required
        />

        <Button type="submit" disabled={loading} variant="brand" size="lg" className="w-full">
          {loading ? "Creando..." : "Crear acceso"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-[#1f67ff] hover:text-[#0a2b6e]">
          Inicia sesion
        </Link>
      </p>
    </AuthShell>
  );
}
