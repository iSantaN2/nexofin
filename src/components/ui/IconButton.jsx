const variants = {
  primary: "bg-[#0a2b6e] text-white hover:bg-[#081f52]",
  soft: "bg-[#eff8ff] text-[#0a2b6e] hover:bg-[#e3f2ff]",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

export default function IconButton({ label, icon, className = "", variant = "soft", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#69d8c4] focus:ring-offset-2 ${
        variants[variant] || variants.soft
      } ${className}`}
      title={label}
      aria-label={label}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
