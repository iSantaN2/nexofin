import {
  BriefcaseBusiness,
  Car,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Home,
  Lightbulb,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Wallet,
} from "lucide-react";

const categoryMap = {
  comida: Utensils,
  "comida rapida": Utensils,
  supermercado: ShoppingCart,
  transporte: Car,
  gasolina: Car,
  entretenimiento: Clapperboard,
  salario: Wallet,
  ingresos: Wallet,
  educacion: GraduationCap,
  salud: HeartPulse,
  hogar: Home,
  compras: ShoppingBag,
  viajes: Plane,
  pasaje: Car,
  trabajo: BriefcaseBusiness,
};

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function CategoryIcon({ category = "", type = "Gasto", className = "" }) {
  const key = normalizeText(category);
  const Icon = categoryMap[key] || Receipt;
  const isIncome = type === "Ingreso" || type === "income";

  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
        isIncome
          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
          : "border-[#dbe8ff] bg-[#f1f7ff] text-[#0a2b6e]"
      } ${className}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
