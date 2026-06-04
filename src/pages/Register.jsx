import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";

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
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const result = await register(email.trim(), password);
      if (result?.verificationEmailSent) {
        toast.success("Cuenta creada. Revisa tu correo para verificarla.");
      } else {
        toast.success("Cuenta creada. Enviaremos verificación desde la pantalla siguiente.");
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
    <AuthShell
      title="Crear cuenta"
      subtitle="Crea tu espacio financiero en menos de un minuto y empieza a ordenar tus movimientos."
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
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full"
            required
          />

          <Button
            type="submit"
            disabled={loading}
            variant="brand"
            size="lg"
            className="w-full"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Ya tienes cuenta?{" "}
          <Link to="/login" className="text-[#1f67ff] hover:text-[#0a2b6e] font-medium">
            Inicia sesión
          </Link>
        </p>
    </AuthShell>
  );
}
