import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";

const CURRENCIES = [
  { code: "PEN", label: "Soles (PEN)" },
  { code: "USD", label: "Dólares (USD)" },
  { code: "EUR", label: "Euros (EUR)" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, userProfile, completeOnboarding } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currency, setCurrency] = useState(userProfile?.currency || "PEN");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.onboardingCompleted) {
      navigate("/", { replace: true });
    }
  }, [userProfile?.onboardingCompleted, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Ingresa tu nombre para continuar");
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding({ displayName, currency });
      toast.success("Perfil inicial guardado correctamente");
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo completar la configuración inicial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Completa tu perfil"
      subtitle="Solo te tomará un minuto. Esto nos ayuda a personalizar tu experiencia financiera."
    >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Cómo quieres que te llamemos"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda principal</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="brand"
            size="lg"
            className="w-full"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </form>
    </AuthShell>
  );
}
