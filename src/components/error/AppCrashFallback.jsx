import Button from "../ui/Button";

export default function AppCrashFallback() {
  return (
    <div className="min-h-screen bg-[#f8fbff] px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[2rem] border border-[#dbe8ff] bg-white p-8 text-center shadow-[0_24px_70px_rgba(10,43,110,0.14)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-2xl text-red-600">
            !
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Recuperacion segura
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#06142e]">Tuvimos un problema inesperado</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            NexoFin encontro un error y detuvo esta vista para proteger tu sesion. Puedes recargar
            la aplicacion para volver a intentarlo.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={() => {
                window.location.reload();
              }}
            >
              Recargar aplicacion
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.assign("/");
              }}
            >
              Ir al inicio
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
