export default function SectionPanel({ title, children, className = "", action = null }) {
  return (
    <section className={`bg-white border border-[#dbe8ff] rounded-lg shadow-sm p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="font-semibold text-slate-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
