import { NavLink } from "react-router-dom";
import {
  Home,
  List,
  CalendarDays,
  BarChart2,
  Settings,
  Layers,
  CreditCard,
} from "lucide-react";

const links = [
  { to: "/", label: "Inicio", icon: <Home size={22} /> },
  { to: "/transactions", label: "Transacciones", icon: <List size={22} /> },
  { to: "/calendar", label: "Calendario", icon: <CalendarDays size={22} /> },
  { to: "/reports", label: "Reportes", icon: <BarChart2 size={22} /> },
  { to: "/categories", label: "CategorÃ­as", icon: <Layers size={22} /> },
  { to: "/methods", label: "MÃ©todos", icon: <CreditCard size={22} /> },
  { to: "/settings", label: "Ajustes", icon: <Settings size={22} /> },
];

export default function Navbar() {
  return (
    <nav
      className="
        flex justify-between items-center 
        bg-white/90 backdrop-blur-md shadow-lg border border-gray-200 
        rounded-2xl px-6 py-3 w-[90%] max-w-md mx-auto
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        md:static md:translate-x-0 md:bottom-auto md:left-auto 
        md:flex-col md:justify-start md:space-y-6 md:w-56 md:h-screen 
        md:rounded-none md:shadow-none md:border-r md:border-gray-200 
        md:px-0 md:py-10
      "
    >
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-col md:flex-row items-center gap-1 md:gap-3 font-medium transition-all ${
              isActive
                ? "text-[#0a2b6e]"
                : "text-gray-500 hover:text-[#1f67ff]"
            }`
          }
        >
          {icon}
          <span className="text-xs md:text-sm">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

