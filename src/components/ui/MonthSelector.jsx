import { useMemo } from "react";

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function buildYearOptions(selectedYear) {
  const currentYear = new Date().getFullYear();
  const baseYear = Number(selectedYear) || currentYear;
  const startYear = Math.min(baseYear, currentYear) - 3;
  const endYear = Math.max(baseYear, currentYear) + 3;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

export default function MonthSelector({ label = "Mes", value, onChange, className = "" }) {
  const [selectedYear = "", selectedMonth = ""] = String(value || "").split("-");
  const yearOptions = useMemo(() => buildYearOptions(selectedYear), [selectedYear]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-500">{label}</label>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] gap-2">
        <select
          value={selectedMonth}
          onChange={(event) => {
            const nextMonth = event.target.value;
            if (selectedYear && nextMonth) onChange?.(`${selectedYear}-${nextMonth}`);
          }}
          className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 text-sm text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
        >
          {MONTH_OPTIONS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(event) => {
            const nextYear = event.target.value;
            if (selectedMonth && nextYear) onChange?.(`${nextYear}-${selectedMonth}`);
          }}
          className="rounded-xl border border-[#dbe8ff] bg-white px-3 py-2 text-sm text-[#061a3d] shadow-sm outline-none transition focus:border-[#1f67ff] focus:ring-4 focus:ring-[#1f67ff]/10"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
