import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import { logError } from "../services/logger";
import { getUserAlias, getUserInitial } from "../utils/profile";

const CURRENCIES = [
  { code: "PEN", label: "Soles (PEN)" },
  { code: "USD", label: "Dolares (USD)" },
  { code: "EUR", label: "Euros (EUR)" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, userProfile, completeOnboarding } = useAuth();

  const [alias, setAlias] = useState(userProfile?.alias || user?.displayName || "");
  const [currency, setCurrency] = useState(userProfile?.currency || "PEN");
  const [loading, setLoading] = useState(false);
  const [editingAlias, setEditingAlias] = useState(!(userProfile?.alias || user?.displayName));
  const resolvedAlias = getUserAlias(user, userProfile);
  const resolvedInitial = getUserInitial(user, userProfile);

  useEffect(() => {
    if (userProfile?.onboardingCompleted) {
      navigate("/", { replace: true });
    }
  }, [userProfile?.onboardingCompleted, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      await completeOnboarding({ alias, currency });
      toast.success("Configuracion inicial guardada correctamente");
      navigate("/", { replace: true });
    } catch (error) {
      logError("No se pudo completar el onboarding", error, {
        source: "auth.onboarding",
      });
      toast.error("No se pudo completar la configuracion inicial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Configura tu espacio"
      subtitle="Tu cuenta ya esta lista. Solo define tu moneda principal para empezar y, si quieres, ajusta tu alias visible."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-2xl border border-[#d9ecff] bg-[#f8fbff] p-4">
          <p className="text-sm font-medium text-slate-500">Asi te veremos en NexoFin</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a2b6e] to-[#11c69a] text-lg font-bold text-white">
              {resolvedInitial}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#06142e]">{alias.trim() || resolvedAlias}</p>
              <p className="truncate text-sm text-slate-500">{user?.email || "-"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingAlias((value) => !value)}
            className="mt-3 text-sm font-medium text-[#1f67ff] hover:text-[#0a2b6e]"
          >
            {editingAlias ? "Ocultar edicion de alias" : "Editar alias"}
          </button>
        </div>

        {editingAlias ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alias visible</label>
            <input
              type="text"
              placeholder="Como quieres que te llamemos"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Moneda principal</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full">
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={loading} variant="brand" size="lg" className="w-full">
          {loading ? "Guardando..." : "Guardar configuracion"}
        </Button>
      </form>
    </AuthShell>
  );
}
