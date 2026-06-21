import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Check,
  CheckCheck,
  Info,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNotifications } from "../hooks/useNotifications";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import SectionPanel from "../components/ui/SectionPanel";
import { formatDateTime } from "../utils/formatters";

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "unread", label: "No leídas" },
  { key: "read", label: "Leídas" },
  { key: "resolved", label: "Resueltas" },
];

const PRIORITY_GROUPS = [
  {
    key: "danger",
    title: "Críticas",
    description: "Alertas que requieren atención inmediata.",
  },
  {
    key: "warning",
    title: "Atención",
    description: "Señales para ajustar tu gasto antes de que se vuelva crítico.",
  },
  {
    key: "info",
    title: "Informativas",
    description: "Recordatorios y avisos generales.",
  },
  {
    key: "success",
    title: "Buenas noticias",
    description: "Eventos positivos o metas saludables.",
  },
];

const severityStyles = {
  info: {
    card: "border-sky-100 bg-sky-50/70",
    icon: "bg-sky-100 text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    label: "Info",
  },
  success: {
    card: "border-emerald-100 bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Bien",
  },
  warning: {
    card: "border-amber-100 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    label: "Atención",
  },
  danger: {
    card: "border-red-100 bg-red-50/70",
    icon: "bg-red-100 text-red-700",
    badge: "bg-red-100 text-red-700",
    label: "Crítica",
  },
};

const getSeverityStyle = (severity) => severityStyles[severity] || severityStyles.info;

const getNotificationCategory = (notification) => {
  const title = notification?.title || "";
  const sourceKey = notification?.sourceKey || "";
  if (title.includes(":")) return title.split(":").slice(1).join(":").trim();
  if (sourceKey.includes("-")) return sourceKey.split("-").slice(2, -1).join("-").trim();
  return "";
};

const getNotificationAction = (notification) => {
  if (notification?.actionPath) {
    return { to: notification.actionPath, label: "Ver detalle" };
  }

  switch (notification?.type) {
    case "budget_limit":
    case "budget_warning":
    case "budget_projection":
      return { to: "/budgets", label: "Ir a Metas" };
    case "unusual_expense":
      return { to: "/", label: "Ver Inicio" };
    case "daily_reminder":
      return { to: "/transactions", label: "Registrar movimiento" };
    default:
      return { to: "/", label: "Ver resumen" };
  }
};

const getFallbackRecommendation = (notification) => {
  const category = getNotificationCategory(notification);

  switch (notification?.type) {
    case "budget_limit":
      return category
        ? `Revisa los gastos de ${category}. Si fue un gasto excepcional, ajusta la meta; si no, intenta compensarlo en otras categorías.`
        : "Revisa esta meta y define una acción para compensar el exceso.";
    case "budget_warning":
      return category
        ? `Mantén ${category} bajo control durante el resto del mes para no llegar al 100%.`
        : "Reduce el ritmo de gasto para mantenerte dentro de tu meta.";
    case "budget_projection":
      return category
        ? `Reduce el ritmo de gasto en ${category} o ajusta la meta si este mes es atípico.`
        : "Revisa tu ritmo de gasto antes de que la proyección se vuelva crítica.";
    case "unusual_expense":
      return category
        ? `Verifica si ${category} fue un gasto puntual o si necesitas crear una meta más realista.`
        : "Revisa si este movimiento fue puntual o representa un nuevo patrón.";
    case "daily_reminder":
      return "Registra tus movimientos de hoy para que tus reportes sigan siendo confiables.";
    default:
      return "Revisa esta alerta y decide si requiere una acción.";
  }
};

function NotificationIcon({ severity, resolved }) {
  const style = getSeverityStyle(severity);
  const Icon = resolved ? ShieldCheck : severity === "danger" || severity === "warning" ? AlertTriangle : Info;

  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}>
      <Icon size={20} />
    </span>
  );
}

export default function Notifications() {
  const {
    notifications,
    notificationsError,
    notificationsLoading,
    loadingMoreNotifications,
    hasMoreNotifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    resolveNotification,
    deleteNotification,
    loadMoreNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState("all");

  const activeNotifications = useMemo(
    () => notifications.filter((item) => item.status !== "resolved"),
    [notifications]
  );

  const summary = useMemo(() => {
    const critical = activeNotifications.filter((item) => item.severity === "danger").length;
    const attention = activeNotifications.filter((item) => item.severity === "warning").length;
    const resolved = notifications.filter((item) => item.status === "resolved").length;
    const riskLevel = critical > 0 ? "Alto" : attention > 0 ? "Medio" : "Bajo";
    const suggestedAction =
      critical > 0
        ? "Resuelve primero las alertas críticas."
        : attention > 0
        ? "Revisa las categorías en atención."
        : "Mantén tu registro actualizado.";

    return { critical, attention, resolved, riskLevel, suggestedAction };
  }, [activeNotifications, notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.read && item.status !== "resolved");
    if (filter === "read") return notifications.filter((item) => item.read && item.status !== "resolved");
    if (filter === "resolved") return notifications.filter((item) => item.status === "resolved");
    return notifications;
  }, [filter, notifications]);

  const groupedNotifications = useMemo(() => {
    return PRIORITY_GROUPS.map((group) => ({
      ...group,
      items: filteredNotifications.filter((item) => (item.severity || "info") === group.key),
    })).filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const handleMarkAllRead = async () => {
    const success = await markAllNotificationsRead();
    if (success) {
      toast.success("Alertas marcadas como leídas");
    } else {
      toast.error("No se pudieron marcar todas las alertas");
    }
  };

  const handleMarkRead = async (id) => {
    const success = await markNotificationRead(id);
    if (success) {
      toast.success("Alerta marcada como leída");
    } else {
      toast.error("No se pudo marcar la alerta");
    }
  };

  const handleResolve = async (id) => {
    const success = await resolveNotification(id);
    if (success) {
      toast.success("Alerta marcada como resuelta");
    } else {
      toast.error("No se pudo resolver la alerta");
    }
  };

  const handleDelete = async (id) => {
    const success = await deleteNotification(id);
    if (success) {
      toast.success("Alerta eliminada");
    } else {
      toast.error("No se pudo eliminar la alerta");
    }
  };

  const handleLoadMore = async () => {
    const success = await loadMoreNotifications();
    if (!success) {
      toast.error("No se pudo cargar mas historial");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Alertas"
        description="Centro de notificaciones financieras de NexoFin."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionPanel className="bg-gradient-to-br from-[#0a2b6e] to-[#1f67ff] text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/75">No leídas</p>
              <p className="mt-1 text-3xl font-bold">{unreadNotificationsCount}</p>
            </div>
            <span className="rounded-2xl bg-white/15 p-3">
              <BellRing size={26} />
            </span>
          </div>
        </SectionPanel>

        <SectionPanel>
          <p className="text-sm text-slate-500">Prioridad activa</p>
          <p className="mt-1 text-3xl font-bold text-[#0a2b6e]">
            {summary.critical} / {summary.attention}
          </p>
          <p className="mt-1 text-xs text-slate-500">Críticas / Atención</p>
        </SectionPanel>

        <SectionPanel>
          <p className="text-sm text-slate-500">Riesgo del mes</p>
          <p
            className={`mt-1 text-3xl font-bold ${
              summary.riskLevel === "Alto"
                ? "text-red-600"
                : summary.riskLevel === "Medio"
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {summary.riskLevel}
          </p>
        </SectionPanel>

        <SectionPanel>
          <p className="text-sm text-slate-500">Acción recomendada</p>
          <p className="mt-2 text-sm text-slate-700">{summary.suggestedAction}</p>
          <p className="mt-1 text-xs text-slate-500">Resueltas: {summary.resolved}</p>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Historial de alertas"
        action={
          <Button
            type="button"
            variant="soft"
            onClick={handleMarkAllRead}
            disabled={unreadNotificationsCount === 0}
          >
            <CheckCheck size={16} />
            Marcar todas como leídas
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filter === item.key
                  ? "bg-gradient-to-r from-[#1f67ff] to-[#11c69a] text-white shadow-sm"
                  : "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {notificationsLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">Cargando alertas...</div>
        ) : notificationsError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {notificationsError}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            title="Sin alertas para mostrar"
            description="Cuando NexoFin detecte metas en riesgo, gastos inusuales o recordatorios, aparecerán aquí."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/budgets"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#1f67ff] to-[#11c69a] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,103,255,0.2)] transition hover:-translate-y-0.5"
                >
                  Revisar metas
                </Link>
                <Link
                  to="/settings"
                  className="rounded-xl bg-[#eff8ff] px-4 py-2 text-sm font-semibold text-[#0a2b6e] hover:bg-[#e3f2ff]"
                >
                  Configurar alertas
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.key} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {group.title}
                  </h3>
                  <p className="text-xs text-slate-400">{group.description}</p>
                </div>

                {group.items.map((item) => {
                  const style = getSeverityStyle(item.severity);
                  const action = getNotificationAction(item);
                  const category = getNotificationCategory(item);
                  const resolved = item.status === "resolved";
                  const recommendation = item.recommendation || getFallbackRecommendation(item);

                  return (
                    <article
                      key={item.id}
                      className={`rounded-2xl border p-4 transition hover:shadow-sm ${style.card} ${
                        resolved ? "opacity-70" : item.read ? "opacity-85" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-3">
                          <NotificationIcon severity={item.severity} resolved={resolved} />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{item.title}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                                {style.label}
                              </span>
                              {resolved ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                  Resuelta
                                </span>
                              ) : !item.read ? (
                                <span className="rounded-full bg-[#0a2b6e] px-2 py-0.5 text-xs font-semibold text-white">
                                  Nueva
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                  Leída
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                            <div className="mt-3 rounded-xl border border-white/70 bg-white/65 p-3 text-sm text-slate-700">
                              <p className="font-semibold text-[#0a2b6e]">Recomendación</p>
                              <p className="mt-1">{recommendation}</p>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              {formatDateTime(item.createdAt)}
                              {item.monthKey ? ` - ${item.monthKey}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                          <Link
                            to={action.to}
                            onClick={() => {
                              if (!item.read && !resolved) markNotificationRead(item.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#1f67ff] to-[#11c69a] px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(31,103,255,0.2)] transition hover:-translate-y-0.5"
                          >
                            {action.label}
                            <ArrowRight size={15} />
                          </Link>
                          {category ? (
                            <Link
                              to={`/transactions?category=${encodeURIComponent(category)}`}
                              onClick={() => {
                                if (!item.read && !resolved) markNotificationRead(item.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#0a2b6e] shadow-sm hover:bg-[#eff8ff]"
                            >
                              Ver categoría
                            </Link>
                          ) : null}
                          {!resolved ? (
                            <Button
                              type="button"
                              onClick={() => handleResolve(item.id)}
                              variant="success"
                              size="sm"
                            >
                              <ShieldCheck size={15} />
                              Resolver
                            </Button>
                          ) : null}
                          {!item.read && !resolved ? (
                            <Button
                              type="button"
                              onClick={() => handleMarkRead(item.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Check size={15} />
                              Leída
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

            {hasMoreNotifications ? (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="soft"
                  onClick={handleLoadMore}
                  disabled={loadingMoreNotifications}
                >
                  {loadingMoreNotifications ? "Cargando historial..." : "Cargar más alertas"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
