const variants = {
  primary: "bg-[#0a2b6e] text-white hover:bg-[#081f52]",
  brand: "bg-[#1f67ff] text-white hover:bg-[#0a2b6e]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  soft: "bg-[#e9f2ff] text-[#0a2b6e] hover:bg-[#d9ecff]",
  neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
