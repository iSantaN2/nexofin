import React, { Suspense, lazy, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";

import {
  Home,
  List,
  CalendarDays,
  BarChart2,
  Target,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import toast from "react-hot-toast";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Budgets = lazy(() => import("./pages/Budgets"));
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
  { to: "/settings", icon: <SettingsIcon className="w-5 h-5" />, label: "Ajustes" },
];

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
      <div className="w-12 h-12 border-4 border-[#1f67ff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesion cerrada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cerrar sesion");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fbff] text-gray-800 relative">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white/95 border-r border-[#d9e6ff] shadow-lg p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <img src="/nexofin-logo.png" alt="NexoFin" className="w-9 h-9 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
              NexoFin
            </h1>
          </div>
          <button
            className="md:hidden text-gray-600 hover:text-[#0a2b6e]"
            onClick={toggleMenu}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#e9f2ff] text-[#0a2b6e]"
                    : "text-gray-700 hover:bg-[#eff8ff] hover:text-[#1565f0]"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <p className="text-xs text-gray-500 truncate" title={user?.email || ""}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0a2b6e] hover:bg-[#081f52] text-white"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
          <div className="text-center text-sm text-gray-500">
            {new Date().getFullYear()} NexoFin
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-0">
        <header className="md:hidden flex items-center justify-between bg-white/95 border-b border-[#d9e6ff] shadow-sm p-4">
          <div className="flex items-center gap-2">
            <img src="/nexofin-logo.png" alt="NexoFin" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#0a2b6e] to-[#12c59a] bg-clip-text text-transparent">
              NexoFin
            </h1>
          </div>
          <button onClick={toggleMenu}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
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
