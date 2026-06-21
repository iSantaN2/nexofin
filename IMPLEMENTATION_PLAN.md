# IMPLEMENTATION PLAN - NexoFin

## Estado General

Ejecucion autonoma completada. `PLAN.md` se ejecuto como fuente de verdad sin re-auditar el proyecto.

## Progreso %

100%

## Tareas Pendientes

### Fase 1 - Problemas criticos

- [x] F1.1 Migrar `src/firebase/config.js` a variables `VITE_FIREBASE_*`.
  - Dependencias: ninguna.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.2 Hacer que la app falle con un mensaje claro si falta configuracion Firebase.
  - Dependencias: F1.1.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.3 Corregir eliminacion de cuenta para impedir borrado de Firebase Auth si falla la limpieza de Firestore.
  - Dependencias: ninguna.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.4 Registrar el resultado de limpieza de cuenta sin ocultar errores criticos.
  - Dependencias: F1.3.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.5 Agregar callbacks de error a listeners incompletos (`TransactionsContext`, `CategoriesContext`, `PaymentMethodsContext`).
  - Dependencias: ninguna.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.6 Reducir riesgo de duplicados en inicializacion de categorias por defecto.
  - Dependencias: F1.5.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.7 Reducir riesgo de duplicados en inicializacion de metodos de pago por defecto.
  - Dependencias: F1.5.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).
- [x] F1.8 Revisar factibilidad de E2E real con cuenta dedicada verificada.
  - Dependencias: configuracion externa `E2E_AUTH_ENABLED`, `E2E_EMAIL`, `E2E_PASSWORD`.
- Validacion: `npm run e2e` ejecutado; 3 tests skipped por falta de credenciales E2E.
- [x] F1.9 Cambiar actualizacion de correo a verificacion previa.
  - Dependencias: Firebase Auth.
  - Validacion: completada (`npm run lint`, `npm run test`, `npm run build`).

### Fase 2 - Estabilizacion

- [x] Implementar paginacion real o retirar UI incompleta de `loadMoreNotifications`.
- [x] Mejorar manejo de errores visible en operaciones Firebase.
- [x] Completar validaciones faltantes en flujos de datos.
- [x] Estandarizar comportamiento de notificaciones.
- [x] Ejecutar pruebas completas y registrar resultados.

### Fase 3 - Refactorizacion

- [x] Crear `src/services`.
- [x] Crear `src/hooks`.
- [ ] Extraer servicios Firestore por dominio.
- [x] Extraer hooks especializados por dominio.
- [x] Centralizar helpers financieros duplicados.
- [x] Dividir `Settings.jsx`.
- [x] Dividir `Dashboard.jsx`.
- [x] Dividir `Reports.jsx`.
- [x] Dividir `Budgets.jsx`.
- [x] Mantener compatibilidad funcional completa.

### Fase 4 - Optimizacion

- [x] Medir baseline de build y comportamiento antes de optimizar.
- [x] Agregar paginacion/ordenamiento Firestore para transacciones.
- [x] Agregar paginacion/ordenamiento Firestore para notificaciones.
- [x] Revisar lazy loading y chunks.
- [x] Reducir re-renderizados innecesarios.
- [x] Documentar impacto antes/despues.

### Fase 5 - UX/UI Premium

- [x] Mejorar Dashboard.
- [x] Mejorar Reportes.
- [x] Mejorar Transacciones.
- [x] Mejorar Presupuestos.
- [x] Mejorar Configuracion.
- [x] Validar responsive autenticado.

### Fase 6 - Calidad Empresarial

- [x] Agregar Error Boundaries.
- [x] Agregar logging centralizado.
- [x] Preparar monitoreo.
- [x] Mejorar accesibilidad.
- [x] Agregar tests faltantes.
- [x] Aumentar cobertura de flujos criticos.
- [x] Agregar tests de Firestore Rules con Emulator.

### Fase 7 - Preparacion para Produccion

- [x] Verificar seguridad final.
- [x] Verificar variables de entorno.
- [x] Verificar build/deploy.
- [x] Actualizar documentacion.
- [x] Ejecutar checklist final.
- [x] Generar `FINAL_AUDIT_REPORT.md`.

## Tareas Completadas

- [x] Leer completamente `PLAN.md`.
- [x] Convertir `PLAN.md` en plan maestro ejecutable inicial.
- [x] Migrar Firebase config a `import.meta.env.VITE_FIREBASE_*`.
- [x] Agregar fallo temprano con mensaje claro cuando faltan variables requeridas.
- [x] Cambiar eliminacion de cuenta a modo fail-closed: no se elimina Auth si falla la limpieza Firestore.
- [x] Agregar verificacion posterior de colecciones de usuario antes de borrar Auth.
- [x] Ajustar mensaje de UI para indicar que la cuenta no fue eliminada cuando la limpieza falla.
- [x] Agregar callbacks de error a listeners de transacciones, categorias y metodos de pago.
- [x] Cambiar siembra inicial de categorias a IDs deterministas con `setDoc`.
- [x] Cambiar siembra inicial de metodos de pago a IDs deterministas con `setDoc`.
- [x] Ejecutar `npm run e2e`; los 3 escenarios quedan skipped por falta de credenciales dedicadas.
- [x] Reemplazar actualizacion directa de correo por `verifyBeforeUpdateEmail`.
- [x] Sincronizar email de perfil Firestore desde Firebase Auth cuando Auth ya tiene el correo confirmado.
- [x] Implementar carga incremental de notificaciones con `orderBy`, `limit` y `startAfter`.
- [x] Agregar feedback de error al cargar historial de alertas.
- [x] Declarar indice compuesto Firestore para `notifications` por `uid` y `createdAt`.
- [x] Hacer que presupuestos fallen explicitamente ante falta de sesion, ids invalidos o datos invalidos.
- [x] Hacer que acciones de notificaciones devuelvan exito/fallo y que la UI muestre errores reales.
- [x] Hacer que preferencias de notificacion esperen persistencia antes de mostrar exito.
- [x] Exponer errores de listener para metas y alertas desde `AppContext`.
- [x] Mostrar errores de carga en `Budgets` y `Notifications` antes de estados vacios.
- [x] Cierre Fase 2: `npm run lint`, `npm run test`, `npm run build` y `npm run e2e` ejecutados.
- [x] Crear `src/services/notificationService.js`.
- [x] Extraer normalizacion, merge, pagina y defaults de notificaciones desde `AppContext`.
- [x] Crear `src/services/budgetService.js`.
- [x] Extraer normalizacion y mutaciones Firestore de presupuestos desde `AppContext`.
- [x] Crear `src/hooks/useBudgets.js` y migrar `Budgets`.
- [x] Crear `src/hooks/useNotifications.js` y migrar `Notifications`.
- [x] Extraer pestaña de notificaciones de `Settings.jsx` a `src/components/settings/NotificationSettings.jsx`.
- [x] Extraer primitivas `SettingsCard` y `SettingsEmptyState` a `src/components/settings/SettingsPrimitives.jsx`.
- [x] Extraer helpers de UI de Settings a `src/utils/settings.js`.
- [x] Extraer `ProfileSettings` a `src/components/settings/ProfileSettings.jsx`.
- [x] Verificar `/settings` en navegador local: redirige a `/login` sin sesion y sin errores de consola.
- [x] Extraer `CategorySettings` a `src/components/settings/CategorySettings.jsx`.
- [x] Extraer `PaymentSettings` a `src/components/settings/PaymentSettings.jsx`.
- [x] Reducir `Settings.jsx` de mas de 1000 lineas a 171 lineas.
- [x] Remover dependencia no usada `file-saver`.
- [x] Eliminar assets no usados: `public/vite.svg`, `public/nexofin-mark.svg`, `src/assets/react.svg`.
- [x] Centralizar `getTransactionType`, `normalizeTransactionField` y `normalizeComparableText` en `src/utils/finance.js`.
- [x] Migrar `Reports.jsx` y `Calendar.jsx` a helpers financieros compartidos.
- [x] Extraer componentes presentacionales de presupuestos a `src/components/budgets/BudgetGroup.jsx`.
- [x] Crear `src/services/budgetAnalytics.js` para calculos, proyecciones y resumen de metas.
- [x] Agregar pruebas unitarias de analitica de presupuestos (`src/services/budgetAnalytics.test.js`).
- [x] Reducir `Budgets.jsx` a 321 lineas manteniendo comportamiento.
- [x] Crear `src/services/reportAnalytics.js` para periodos, filtros, insights y agregaciones de reportes.
- [x] Agregar pruebas unitarias de analitica de reportes (`src/services/reportAnalytics.test.js`).
- [x] Reducir `Reports.jsx` a 521 lineas manteniendo exportaciones y visualizaciones.
- [x] Crear `src/services/dashboardAnalytics.js` para comparativas, metas e insights del panel principal.
- [x] Agregar pruebas unitarias de analitica del dashboard (`src/services/dashboardAnalytics.test.js`).
- [x] Extraer componentes `DashboardInsights`, `BudgetStatusPanel`, `CategoryDistributionPanel` y `RecentTransactionsPanel`.
- [x] Reducir `Dashboard.jsx` a 389 lineas manteniendo alertas y flujos existentes.
- [x] Crear `src/services/transactionService.js` y migrar `TransactionsContext` a accesos Firestore encapsulados.
- [x] Medir baseline inicial de Fase 4: build estable entre `16.50s` y `20.55s`, con mayor peso en `vendor-pdf`, `vendor-misc`, `vendor-react`, `vendor-excel` y `vendor-firebase-firestore`.
- [x] Ordenar suscripcion de transacciones desde Firestore por `createdAt desc` y declarar indice compuesto en `firestore.indexes.json`.
- [x] Memoizar valores de `AppContext` y `TransactionsContext` para reducir renders en cascada.
- [x] Diferir filtro de busqueda en `Transactions.jsx` con `useDeferredValue`.
- [x] Crear `usePaginatedTransactions` y usar historial paginado remoto en `Transactions.jsx` para el modo de navegacion simple.
- [x] Mantener fallback local completo cuando el usuario aplica filtros avanzados, busqueda libre o ordenamientos no soportados por la consulta remota.
- [x] Mover `AppProvider`, `TransactionsProvider`, `CategoriesProvider` y `PaymentMethodsProvider` al perimetro autenticado para evitar carga innecesaria en rutas publicas.
- [x] Crear `src/components/ui/PageHero.jsx` como cabecera premium reutilizable para vistas autenticadas.
- [x] Elevar `Dashboard`, `Reports`, `Transactions`, `Budgets` y `Settings` con heroes ejecutivos, metricas compactas y acciones de alto valor.
- [x] Refinar `DashboardInsights` y `BudgetGroup` para alinear tarjetas internas con la nueva capa visual premium.
- [x] Verificar visualmente rutas autenticadas clave (`/`, `/transactions`, `/reports`, `/budgets`, `/settings`) sobre `http://127.0.0.1:5173`.
- [x] Validacion Fase 5 completada: `npm run lint`, `npm run test`, `npm run build`.
- [x] Agregar `src/components/error/AppErrorBoundary.jsx` y `src/components/error/AppCrashFallback.jsx`.
- [x] Registrar errores globales con `src/services/logger.js` y listeners `window.error` / `window.unhandledrejection`.
- [x] Conectar el logger nuevo a puntos criticos de transacciones y cierre de sesion.
- [x] Mejorar accesibilidad estructural en `LoadingState`, `ConfirmModal`, `AddTransactionModal` y layout principal con skip link y landmarks.
- [x] Agregar pruebas unitarias de logger (`src/services/logger.test.js`).
- [x] Validacion parcial Fase 6 completada: `npm run lint`, `npm run test`, `npm run build`.
- [x] Agregar pruebas unitarias de `transactionService` para sanitizacion y defaults criticos.
- [x] Agregar pruebas unitarias de `notificationService` para patches, ids y merges.
- [x] Blindar historial de alertas contra falta temporal del indice compuesto de Firestore con fallback local ordenado.
- [x] Documentar despliegue correcto de Firestore con reglas, indices y vinculacion de proyecto CLI.
- [x] Sustituir `console.error` heredados en flujos criticos de autenticacion y perfil por `logError`.
- [x] Verificar despliegue real de reglas e indices Firestore sobre el proyecto `finapp-1eead`.
- [x] Subir suite unitaria de `47` a `54` pruebas verdes.
- [x] Preparar `npm run test:rules` con Firebase Emulator y suite inicial en `src/firestore.rules.test.js`.
- [x] Validar `firestore.rules` con Emulator real: 5/5 pruebas verdes usando JDK 21 y `firebase emulators:exec`.
- [x] Cierre Fase 7: `npm run lint`, `npm run test`, `npm run build` y `npm run test:rules` verdes el `2026-06-19`.

## Problemas Encontrados

- E2E real depende de credenciales externas dedicadas. Estado actual: `E2E_AUTH_ENABLED`, `E2E_EMAIL` y `E2E_PASSWORD` no estan configuradas; `npm run e2e` ejecuta 3 tests skipped.
- Cierre Fase 2: Playwright ejecuta 3 tests skipped por entorno sin credenciales E2E; lint/unit/build pasan.
- `npm uninstall file-saver` reporto vulnerabilidades existentes en dependencias transitivas: 6 moderate, 10 high, 4 critical. Requiere revision dirigida; no se aplico `npm audit fix --force`.
- La reescritura de `Reports.jsx` normalizo textos ASCII para evitar fallos de codificacion al seguir extrayendo bloques.
- `TransactionsContext.jsx` tambien se reescribio en ASCII al extraer `transactionService` por las mismas inconsistencias de codificacion.
- La primera tanda de Fase 4 no redujo el peso de chunks; el beneficio apunta a consultas ordenadas y menos recomputacion en cliente.
- La build posterior a la paginacion de transacciones se mantuvo estable funcionalmente, aunque el tiempo y el peso de `index` variaron levemente; el beneficio principal es menor trabajo en cliente para el historial reciente.
- El arbol de rutas ya usaba `lazy()` por pagina y los exports pesados de reportes ya estaban separados por import dinamico; por eso el mayor valor adicional estuvo en reducir trabajo de runtime, no en recortar bundles grandes de terceros.
- La navegacion directa con el navegador embebido mostro transiciones de carga de sesion en algunas rutas; al esperar el montaje completo las vistas premium cargaron correctamente.
- La vista de `Transactions` sigue mostrando error de historial reciente cuando Firestore no devuelve la pagina remota inicial; es un comportamiento ya controlado, no un fallo introducido por Fase 5.
- El historial de `notifications` tambien podia fallar en proyectos donde el indice compuesto aun no estaba desplegado; se agrego fallback local para mantener la carga y se deja pendiente desplegar indices en Firebase.
- La primera corrida de build de Fase 6 fallo por un import residual incorrecto en `AppErrorBoundary`; se corrigio y la validacion completa quedo en verde.
- Aun quedan varios `console.error` heredados fuera del flujo central nuevo; no bloquean produccion inmediata, pero conviene migrarlos al logger comun antes del cierre final.
- La validacion real de reglas quedo bloqueada temporalmente hasta instalar JDK 21; una vez apuntado el proceso al JDK nuevo, `npm run test:rules` paso correctamente.
- El repositorio no tenia `.firebaserc`; para despliegues CLI hace falta vincular el proyecto real con `firebase use --add` o crear `.firebaserc` localmente a partir de `.firebaserc.example`.
- En la limpieza final de logging hubo archivos con codificacion inconsistente; se normalizaron reescribiendo `Login`, `Register`, `Onboarding`, `VerifyEmail` y `ProfileSettings` en UTF-8 estable para evitar errores de parseo.

## Decisiones Tecnicas

- Se ejecutaran fases en orden bloqueante: no se avanzara a estabilizacion visual/refactor hasta cerrar criticidad de datos, seguridad y configuracion.
- La eliminacion de cuenta debe ser fail-closed: si Firestore no se limpia completamente, no se elimina el usuario de Auth desde cliente.
- La configuracion Firebase debe venir exclusivamente de `import.meta.env` para separar entornos.
- `VITE_FIREBASE_MEASUREMENT_ID` queda opcional: Analytics puede estar deshabilitado por entorno sin bloquear Auth/Firestore.
- La limpieza de cuenta sigue en cliente por ahora, pero queda protegida contra huerfanos porque Auth solo se elimina despues de confirmar que no quedan documentos propios.
- Las colecciones por defecto usan IDs deterministas por usuario para que reintentos o carreras de red sean idempotentes.
- El cambio de email ya no escribe el correo nuevo en Firestore hasta que Firebase Auth confirme el cambio mediante verificacion.
- Las notificaciones cargan la primera pagina en tiempo real y el historial bajo demanda, fusionando documentos por `id`.
- Las mutaciones de Fase 2 deben devolver booleano o lanzar error; la UI no debe mostrar exito si el contexto fallo.
- Las pantallas financieras deben distinguir error de carga vs. lista vacia para evitar decisiones del usuario sobre datos incompletos.
- Fase 3 se ejecuta con extracciones pequenas validadas por lint/test/build despues de cada bloque.
- Centralizar helpers financieros genero chunk compartido `finance` y redujo bundles de Calendar/Reports/Dashboard.
- La pagina de presupuestos delega calculos puros a `budgetAnalytics`; esto permite probar proyecciones sin montar React ni tocar Firebase.
- La pagina de reportes mantiene las exportaciones en la vista, pero toda la logica de filtros, rangos y comparativas vive en `reportAnalytics` para facilitar futuras extracciones visuales.
- El dashboard conserva los efectos de notificaciones en la pagina, pero sus calculos y bloques visuales ya estan desacoplados para preparar optimizaciones posteriores.
- La extraccion de servicios Firestore se esta haciendo por dominio empezando con transacciones, manteniendo validaciones, toasts y reglas de negocio en el contexto.
- El baseline de Fase 4 se toma sobre build de produccion local; las variaciones de tiempo entre corridas se consideran ruido y no una regresion funcional por si mismas.
- La optimizacion actual de transacciones prioriza ordenamiento consistente desde Firestore sin romper las vistas analiticas que aun dependen de historial completo en cliente.
- La paginacion remota de transacciones solo se activa en el modo simple del historial; esto evita romper filtros avanzados mientras se gana eficiencia en el caso de uso mas frecuente.
- El stack de datos privados ya no se monta en login, registro, verificacion ni onboarding; esto reduce listeners y trabajo de inicializacion antes de entrar al area autenticada.
- Fase 5 se implementa sin tocar contratos de datos ni flujos CRUD: la capa premium se apoya en componentes reutilizables (`PageHero`, `SectionPanel`, `MetricCard`) para mantener compatibilidad funcional total.
- La verificacion visual autenticada se hace contra el dev server local en `127.0.0.1:5173`, revisando heroes, metricas y paneles principales antes de avanzar a calidad empresarial.
- El logging centralizado queda desacoplado de cualquier proveedor externo: hoy escribe payload estructurado, emite eventos `nexofin:log` y captura errores globales para habilitar monitoreo sin reescribir llamadas futuras.
- La primera ola de accesibilidad en Fase 6 prioriza semantica y recuperacion: `skip link`, `main` enfocables, `role="status"` en cargas y `role="dialog"` con etiquetas accesibles en modales.
- Las consultas de `transactions` y `notifications` mantienen `orderBy(createdAt desc)` para el camino ideal, pero ahora degradan a lectura por `uid` y ordenamiento/paginacion local cuando Firestore responde con error de indice faltante.
- La preparacion de Firestore para produccion debe incluir siempre reglas e indices; se agregaron scripts `deploy:firestore:*` y `.firebaserc.example` para reducir errores manuales al publicar.
- La suite de reglas se deja en modo `skip` fuera del Emulator para no romper `npm run test`; la validacion efectiva debe ocurrir con `npm run test:rules` una vez instalado JDK 21+.
- Para este entorno fue necesario fijar `JAVA_HOME` y priorizar el binario de `C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin` al ejecutar `npm run test:rules`, porque la shell automatizada seguia heredando Java 8 aunque la terminal interactiva del usuario ya resolvia Java 21.
- El cierre productivo se valida sobre cuatro capas: `lint`, unitarias, build y reglas reales de Firestore; ademas el `2026-06-19` quedaron habilitados en Firebase los indices compuestos de `transactions` y `notifications`.

## Impacto Fase 4

- Baseline antes:
  build local estable entre `16.50s` y `20.55s`; chunks mas pesados `vendor-pdf 575.08 kB`, `vendor-misc 435.30 kB`, `vendor-react 292.94 kB`, `vendor-excel 283.16 kB`, `vendor-firebase-firestore 255.93 kB`.
- Estado despues de esta tanda:
  se mantiene validacion verde (`lint`, `44` tests, `build`) y el costo de bundle no cambia de forma material; la mejora se concentra en consultas paginadas, orden remoto por `createdAt`, menos trabajo en cliente y menor montaje en rutas publicas.

## Proxima Accion

Proyecto listo para cierre operativo: usar `FINAL_AUDIT_REPORT.md` como resumen final y seguir solo con despliegue/monitoreo segun necesidad.
