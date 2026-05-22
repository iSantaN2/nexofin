import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CURRENCIES = [
  { code: "PEN", label: "Soles (PEN)" },
  { code: "USD", label: "Dolares (USD)" },
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
      toast.error("No se pudo completar la configuracion inicial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-[#d9e6ff] shadow-lg rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <img src="/nexofin-logo.png" alt="NexoFin" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
            NexoFin
          </h1>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#0a2b6e]">Completa tu perfil inicial</h2>
          <p className="text-sm text-gray-600 mt-1">
            Solo te tomara un minuto. Esto nos ayuda a personalizar tu experiencia.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Como quieres que te llamemos"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda principal</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a2b6e] hover:bg-[#081f52] text-white py-2 rounded-lg disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
