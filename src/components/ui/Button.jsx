const variants = {
  primary:
    "bg-[#0a2b6e] text-white shadow-[0_10px_24px_rgba(10,43,110,0.18)] hover:bg-[#081f52] hover:-translate-y-0.5",
  brand:
    "bg-gradient-to-r from-[#1f67ff] to-[#11c69a] text-white shadow-[0_10px_24px_rgba(31,103,255,0.2)] hover:-translate-y-0.5",
  success:
    "bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.16)] hover:bg-emerald-700 hover:-translate-y-0.5",
  danger:
    "bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.16)] hover:bg-red-700 hover:-translate-y-0.5",
  soft: "bg-[#eff8ff] text-[#0a2b6e] ring-1 ring-[#dbe8ff] hover:bg-[#e3f2ff]",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200",
  ghost: "bg-transparent text-[#0a2b6e] hover:bg-[#eff8ff]",
  outline: "bg-white text-[#0a2b6e] ring-1 ring-[#dbe8ff] hover:bg-[#f8fbff]",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#69d8c4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
