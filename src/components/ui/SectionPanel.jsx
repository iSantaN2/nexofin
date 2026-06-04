export default function SectionPanel({ title, children, className = "", action = null }) {
  return (
    <section
      className={`nexo-panel relative overflow-hidden p-4 sm:p-5 transition-shadow duration-200 hover:shadow-[0_18px_45px_rgba(10,43,110,0.08)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-[#061a3d]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
