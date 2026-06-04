export default function IconButton({ label, icon, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${className}`}
      title={label}
      aria-label={label}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
