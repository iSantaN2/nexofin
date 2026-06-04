import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export default function AuthShell({ title, subtitle, eyebrow = "NexoFin", children }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fbff] p-4 text-slate-900">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1f67ff]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#11c69a]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-[#19b9c7]/10 blur-3xl" />
      </div>

      <main className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#0a2b6e] via-[#123f91] to-[#11c69a] p-8 text-white shadow-[0_28px_80px_rgba(10,43,110,0.24)] lg:block">
          <div className="flex items-center gap-3">
            <img src="/nexofin-logo.png" alt="NexoFin" className="h-12 w-12 rounded-2xl bg-white/95 object-contain p-1" />
            <div>
              <p className="text-sm text-white/75">{eyebrow}</p>
              <h1 className="text-3xl font-bold text-white">Conecta tus decisiones</h1>
            </div>
          </div>

          <div className="mt-16 max-w-xl">
            <p className="text-5xl font-bold leading-tight text-white">
              Tu dinero, tus metas y tus alertas en un solo panel.
            </p>
            <p className="mt-5 text-lg text-white/78">
              NexoFin te ayuda a registrar movimientos, detectar riesgos y tomar mejores decisiones financieras cada mes.
            </p>
          </div>

          <div className="mt-12 grid gap-3">
            {[
              { icon: TrendingUp, text: "Insights automáticos del mes" },
              { icon: ShieldCheck, text: "Datos separados por usuario" },
              { icon: Sparkles, text: "Alertas para actuar a tiempo" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={20} />
                </span>
                <span className="font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[1.75rem] border border-[#d9e6ff] bg-white/92 p-6 shadow-[0_22px_65px_rgba(10,43,110,0.12)] backdrop-blur md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <img src="/nexofin-logo.png" alt="NexoFin" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-sm font-semibold text-[#11a987]">{eyebrow}</p>
              <h2 className="text-2xl font-bold text-[#061a3d]">{title}</h2>
            </div>
          </div>
          {subtitle ? <p className="mb-5 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          {children}
        </section>
      </main>
    </div>
  );
}
