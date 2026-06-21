import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const NOTIFICATION_TOGGLES = [
  {
    key: "budget80Enabled",
    title: "Alerta al 80% de meta",
    description: "Muestra aviso cuando una categoria de gasto llega al 80% de su meta mensual.",
    icon: Bell,
    tone: "text-amber-600 bg-amber-50",
  },
  {
    key: "budget100Enabled",
    title: "Alerta al 100% de meta",
    description: "Muestra aviso cuando una categoria llega o supera el 100% de su meta mensual.",
    icon: AlertTriangle,
    tone: "text-red-600 bg-red-50",
  },
  {
    key: "dailyReminderEnabled",
    title: "Recordatorio diario",
    description: "Muestra aviso una vez al dia cuando aun no registraste movimientos hoy.",
    icon: CheckCircle2,
    tone: "text-[#0a2b6e] bg-[#e9f2ff]",
  },
];

export default function NotificationSettings({ notificationSettings, updateNotificationSettings }) {
  const [savingKey, setSavingKey] = useState("");

  const handleToggle = async (keyName) => {
    const currentValue = !!notificationSettings?.[keyName];
    setSavingKey(keyName);
    const success = await updateNotificationSettings({ [keyName]: !currentValue });
    if (success) {
      toast.success("Preferencia de notificacion actualizada");
    } else {
      toast.error("No se pudo guardar la preferencia");
    }
    window.setTimeout(() => {
      setSavingKey("");
    }, 250);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f67ff]">
          Centro de alertas
        </p>
        <h3 className="mt-2 text-xl font-bold text-[#06142e]">Notificaciones financieras</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Elige que senales debe vigilar NexoFin para ayudarte antes de que un gasto se salga de
          control.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {NOTIFICATION_TOGGLES.map((toggle) => {
          const enabled = !!notificationSettings?.[toggle.key];
          const isSaving = savingKey === toggle.key;
          const Icon = toggle.icon;

          return (
            <div
              key={toggle.key}
              className={`rounded-[1.5rem] border p-4 shadow-sm transition ${
                enabled ? "border-[#11c69a]/35 bg-[#f4fffb]" : "border-[#dbe8ff] bg-white"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toggle.tone}`}
                >
                  <Icon size={19} />
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {enabled ? "Activa" : "Pausada"}
                </span>
              </div>

              <div className="min-h-24">
                <p className="font-bold text-[#06142e]">{toggle.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{toggle.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(toggle.key)}
                disabled={isSaving}
                className={`relative mt-4 inline-flex h-8 w-14 shrink-0 rounded-full border transition ${
                  enabled ? "bg-[#12c59a] border-[#12c59a]" : "bg-gray-200 border-gray-300"
                } ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
                aria-pressed={enabled}
                aria-label={toggle.title}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                    enabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
