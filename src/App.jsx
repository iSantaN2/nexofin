import React, { Suspense, lazy, useContext, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import {
  Home,
  List,
  CalendarDays,
  BarChart2,
  Target,
  Bell,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingState from "./components/ui/LoadingState";
import { useAuth } from "./context/AuthContext";
import { AppContext } from "./context/AppContext";
import toast from "react-hot-toast";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

const navItems = [
  { to: "/", icon: <Home className="w-5 h-5" />, label: "Inicio" },
  { to: "/transactions", icon: <List className="w-5 h-5" />, label: "Transacciones" },
  { to: "/calendar", icon: <CalendarDays className="w-5 h-5" />, label: "Calendario" },
  { to: "/reports", icon: <BarChart2 className="w-5 h-5" />, label: "Reportes" },
  { to: "/budgets", icon: <Target className="w-5 h-5" />, label: "Metas" },
  { to: "/notifications", icon: <Bell className="w-5 h-5" />, label: "Alertas", badge: true },
  { to: "/settings", icon: <SettingsIcon className="w-5 h-5" />, label: "Ajustes" },
];

const bottomNavItems = navItems.filter((item) =>
  ["/", "/transactions", "/calendar", "/budgets", "/notifications"].includes(item.to)
);

function RouteLoader() {
  return <LoadingState fullScreen title="Abriendo NexoFin" description="Estamos preparando la vista." />;
}

function NotificationBadge({ count }) {
  if (!count) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#12c59a] px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function SidebarNavLink({ item, unreadNotificationsCount, onClick }) {
  return (
    <NavLink
      to={item.to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3 py-3 font-medium transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-[#e9f2ff] to-[#ebfbf7] text-[#0a2b6e] shadow-sm"
            : "text-slate-600 hover:bg-[#eff8ff] hover:text-[#1565f0]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute inset-y-3 left-0 w-1 rounded-full transition-opacity ${
              isActive ? "bg-gradient-to-b from-[#1f67ff] to-[#11c69a] opacity-100" : "opacity-0"
            }`}
          />
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              isActive ? "bg-white text-[#0a2b6e] shadow-sm" : "bg-transparent text-slate-500 group-hover:bg-white"
            }`}
          >
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          {item.badge ? <NotificationBadge count={unreadNotificationsCount} /> : null}
        </>
      )}
    </NavLink>
  );
}

function MobileBottomNav({ unreadNotificationsCount }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-3xl border border-[#dbe8ff] bg-white/92 p-2 shadow-[0_20px_55px_rgba(10,43,110,0.18)] backdrop-blur-xl md:hidden">
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${
              isActive ? "bg-[#e9f2ff] text-[#0a2b6e]" : "text-slate-500 hover:bg-[#eff8ff] hover:text-[#1565f0]"
            }`
          }
        >
          {item.icon}
          <span className="max-w-full truncate">{item.label}</span>
          {item.badge && unreadNotificationsCount > 0 ? (
            <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-[#12c59a] ring-2 ring-white" />
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const { unreadNotificationsCount } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const userInitial = (user?.email || "N").charAt(0).toUpperCase();

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cerrar sesión");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fbff] text-gray-800 relative">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white/92 border-r border-[#d9e6ff] shadow-[0_25px_70px_rgba(10,43,110,0.14)] backdrop-blur-xl p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img src="/nexofin-logo.png" alt="NexoFin" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
                NexoFin
              </h1>
              <p className="text-xs font-medium text-slate-400">Tu futuro financiero</p>
            </div>
          </div>
          <button
            className="md:hidden rounded-xl p-2 text-gray-600 hover:bg-[#eff8ff] hover:text-[#0a2b6e]"
            onClick={toggleMenu}
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-5 rounded-3xl border border-[#dbe8ff] bg-gradient-to-br from-[#f8fbff] to-[#ebfbf7] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0a2b6e]">Panel activo</p>
          <p className="mt-1 text-sm text-slate-500">Controla balance, metas y alertas desde una sola vista.</p>
        </div>

        <nav className="flex flex-col space-y-1.5">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.to}
              item={item}
              unreadNotificationsCount={unreadNotificationsCount}
              onClick={closeMenu}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-3 rounded-3xl border border-[#dbe8ff] bg-white/80 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a2b6e] to-[#11c69a] font-bold text-white">
              {userInitial}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Cuenta activa</p>
              <p className="truncate text-sm font-semibold text-[#061a3d]" title={user?.email || ""}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#0a2b6e] hover:bg-[#081f52] text-white shadow-sm transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <div className="text-center text-sm text-gray-500">
            {new Date().getFullYear()} NexoFin
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-0">
        <header className="sticky top-0 z-20 md:hidden flex items-center justify-between bg-white/90 border-b border-[#d9e6ff] shadow-sm p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <img src="/nexofin-logo.png" alt="NexoFin" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
                NexoFin
              </h1>
              <p className="text-[11px] text-slate-400">Panel financiero</p>
            </div>
          </div>
          <button
            onClick={toggleMenu}
            className="rounded-2xl border border-[#dbe8ff] bg-white p-2 shadow-sm"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-transparent px-4 pb-28 pt-4 sm:p-6 md:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <MobileBottomNav unreadNotificationsCount={unreadNotificationsCount} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
