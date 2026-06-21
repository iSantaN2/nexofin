# PLAN DE AUDITORÍA Y MEJORA - NexoFin

## 1. Resumen general

NexoFin está construido como una aplicación React + Vite conectada directamente a Firebase Auth y Cloud Firestore. No existe un backend Node/Express separado; la capa backend real está compuesta por Firebase Auth, Firestore, las reglas de seguridad en `firestore.rules` y la lógica de acceso a datos ubicada en los contextos de React.

El estado técnico general es bueno para una app personal/financiera en fase avanzada: `npm run lint`, `npm run test` y `npm run build` pasan correctamente. También se levantó la app local en `http://localhost:5173`, se verificaron rutas públicas, redirecciones protegidas y responsive básico de login/register sin errores de consola.

El proyecto todavía tiene deuda importante antes de considerarlo listo para producción: configuración Firebase hardcodeada, archivos de página demasiado grandes, lógica de negocio mezclada con UI, pruebas E2E reales desactivadas por falta de credenciales, carga completa de colecciones sin paginación, y un riesgo relevante en eliminación de cuenta si falla la limpieza de datos antes de borrar el usuario de Firebase Auth.

## 2. Cosas que están bien

- La estructura principal es clara: `src/pages`, `src/components`, `src/components/ui`, `src/context`, `src/utils`, `src/firebase`.
- El frontend usa rutas protegidas centralizadas con `ProtectedRoute` y separa login, registro, verificación y onboarding.
- El build está optimizado con lazy loading de páginas y `manualChunks` en `vite.config.js`.
- Hay componentes UI reutilizables: `Button`, `MetricCard`, `PageHeader`, `SectionPanel`, `EmptyState`, `LoadingState`.
- Hay pruebas unitarias para lógica financiera, transacciones, formateo, validación y notificaciones: 35 tests pasan.
- Firestore Rules están bastante bien planteadas: validan usuario autenticado, ownership, campos permitidos, tipos y límites básicos.
- Las colecciones principales están conectadas a Firestore: `users`, `transactions`, `categories`, `paymentMethods`, `budgets`, `notifications`, `notificationSettings`.
- No se detectaron datos mock activos en las pantallas principales; las vistas consumen contextos conectados.
- Las rutas públicas `/login` y `/register` renderizan correctamente en escritorio y móvil.
- Las rutas privadas redirigen correctamente a `/login` cuando no hay sesión.
- El diseño tiene una identidad visual consistente: azul/navy, verde/teal, tarjetas claras, métricas, estados vacíos y navegación lateral/bottom nav.
- Existe documentación útil en `README.md` y `docs/DEPLOYMENT.md`.
- CI existe en `.github/workflows/ci.yml` con lint, tests, build y E2E.

## 3. Problemas encontrados

### Críticos

- Riesgo de datos huérfanos al eliminar cuenta. En `src/context/AuthContext.jsx` aprox. líneas 247-254, si `purgeUserData(uid)` falla, se captura el error pero igual se ejecuta `deleteUser(currentUser)`. Resultado posible: la cuenta Auth desaparece, pero quedan documentos en Firestore asociados a un `uid` que ya no puede autenticarse para limpiarlos. Esto es crítico por privacidad y cumplimiento.
- Los flujos privados reales no quedaron validados de punta a punta porque los E2E se saltan sin credenciales. `tests/e2e/auth-transactions.spec.js` líneas 7-10 y `tests/e2e/register-onboarding.spec.js` líneas 7-9 usan `test.skip`. En esta auditoría `npm run e2e` ejecutó 3 tests y los 3 quedaron `skipped`.

### Importantes

- Firebase está hardcodeado en `src/firebase/config.js` líneas 6-14, aunque `.env.example`, README y deployment docs indican usar `VITE_FIREBASE_*`. No es una llave secreta en sentido estricto, pero rompe la separación por entorno y acopla todos los builds a `finapp-1eead`.
- No hay backend propio ni capa de servicios aislada. La lógica de negocio, validación, notificaciones y persistencia vive principalmente en contextos React. Para una app financiera, conviene mover reglas críticas a servicios modulares y evaluar Cloud Functions para tareas sensibles.
- Las páginas son demasiado grandes: `Settings.jsx` 1083 líneas, `Dashboard.jsx` 803, `Reports.jsx` 684, `Budgets.jsx` 510, `Transactions.jsx` 464, `Notifications.jsx` 429. Esto dificulta mantenimiento, testing y reutilización.
- Hay lógica duplicada de clasificación financiera. Ejemplos: `isIncome`, `normalizeType`, `calculateTotals`, normalización de categoría y fechas aparecen en páginas y utils (`src/pages/Reports.jsx`, `src/pages/Calendar.jsx`, `src/pages/Budgets.jsx`, `src/utils/finance.js`, `src/utils/transactions.js`).
- Las consultas Firestore cargan colecciones completas del usuario con `onSnapshot` y luego ordenan/filtran en cliente. Esto escala mal para transacciones, reportes y notificaciones.
- `loadMoreNotifications` está incompleto en `src/context/AppContext.jsx` líneas 186-188; la UI tiene botón de “Cargar más alertas” en `src/pages/Notifications.jsx`, pero `hasMoreNotifications` siempre es `false`.
- Cambio de correo usa `updateEmail` en `src/context/AuthContext.jsx` líneas 214-222, pero no envía verificación explícita al nuevo correo ni documenta claramente el estado posterior. Puede dejar al usuario en flujo de verificación hasta que reenvíe manualmente.
- `CategoriesContext` y `PaymentMethodsContext` inicializan valores por defecto desde efectos con `onSnapshot` + `getDocs`. En condiciones de doble efecto/dev o carrera de red, podría haber duplicados si dos inicializaciones ven la colección vacía.
- No hay tests para Firestore Rules. Dado que las reglas son la verdadera autorización backend, faltan pruebas con Firebase Emulator.
- No hay manejo granular de errores en listeners de `TransactionsContext`, `CategoriesContext` y `PaymentMethodsContext`; algunos `onSnapshot` no tienen callback de error.

### Menores

- Dependencia probablemente innecesaria: `file-saver` aparece en `package.json` línea 19, pero no se usa en `src`.
- Assets no usados: `public/vite.svg`, `public/nexofin-mark.svg`, `src/assets/react.svg`.
- `PLAN_3_FASES_NEXOFIN.md` parece documentación previa que podría archivarse o fusionarse con este plan.
- `dev-server.out.log` y `dev-server.err.log` están en el workspace; están ignorados por `.gitignore`, pero no aportan al proyecto.
- Algunos textos en código muestran mojibake al leer desde consola (`SesiÃ³n`, `CategorÃ­a`). En navegador los textos principales se ven bien, pero conviene normalizar codificación UTF-8 y revisar todos los labels.
- Estilos globales como `button:hover svg` en `src/index.css` aplican rotación a todos los iconos de botones; puede sentirse poco premium en acciones serias como eliminar cuenta o seguridad.
- Hay mezcla de estilos: componentes UI compartidos conviven con muchas clases Tailwind inline específicas por página.
- Hay pocos `aria-label` en algunos botones de solo icono, aunque varios sí tienen `title`. Conviene estandarizar accesibilidad.

## 4. Código innecesario o duplicado

- `package.json`: `file-saver` no se usa.
- `public/vite.svg`, `public/nexofin-mark.svg`, `src/assets/react.svg`: no tienen referencias activas.
- `src/pages/Reports.jsx`: duplica `normalizeType`, `calculateTotals`, formateo y normalización que deberían vivir en `src/utils`.
- `src/pages/Calendar.jsx`: duplica `isIncome`, `matchesTypeFilter` y normalización de categoría.
- `src/pages/Budgets.jsx`: duplica lógica de status de presupuesto que se parece a `getBudgetStatus` en `src/utils/finance.js`.
- `src/pages/Settings.jsx`: contiene varias subpantallas completas dentro del mismo archivo (`ProfileSettings`, `CategorySettings`, `PaymentSettings`, `NotificationSettings`, listas y modales). Debe dividirse.
- `src/context/AppContext.jsx`: mezcla presupuestos, notificaciones, preferencias y paginación futura.
- `src/context/AuthContext.jsx`: mezcla autenticación, perfil, reautenticación y limpieza masiva de datos.
- `PLAN_3_FASES_NEXOFIN.md`: revisar si sigue vigente o migrar contenido a documentación principal.

## 5. Revisión de navegación y páginas

| Ruta / pantalla | Estado | Observación |
| --- | --- | --- |
| `/login` | Funciona correctamente | Renderiza en escritorio/móvil, campos visibles, recuperación de contraseña disponible, sin errores de consola. |
| `/register` | Funciona correctamente | Renderiza en escritorio/móvil, campos visibles, sin errores de consola. Registro real no ejecutado para evitar crear cuenta externa sin credenciales dedicadas. |
| `/` | Protegida correctamente | Sin sesión redirige a `/login`. Dashboard no pudo validarse con datos reales por falta de cuenta E2E activa. |
| `/transactions` | Protegida correctamente | Redirige a `/login` sin sesión. Código conectado a Firestore; E2E real saltado. |
| `/calendar` | Protegida correctamente | Redirige a `/login` sin sesión. Código consume transacciones reales. |
| `/reports` | Protegida correctamente | Redirige a `/login` sin sesión. Exportaciones PDF/CSV/Excel implementadas; no se probaron con datos reales. |
| `/budgets` | Protegida correctamente | Redirige a `/login` sin sesión. Metas conectadas a Firestore. |
| `/notifications` | Protegida correctamente / incompleta | Redirige a `/login` sin sesión. Centro conectado, pero carga incremental incompleta. |
| `/settings` | Protegida correctamente | Redirige a `/login` sin sesión. Perfil, categorías, métodos y preferencias conectados. |
| `/verify-email` | Protegida correctamente | Sin sesión redirige a `/login`. |
| `/onboarding` | Protegida correctamente | Sin sesión redirige a `/login`. |
| Ruta desconocida | Funciona correctamente | Sin sesión termina en `/login`; dentro del shell privado hay fallback a `/`. |

## 6. Revisión del frontend

El frontend está bien encaminado visualmente. La app se siente más trabajada que una plantilla básica: hay identidad de marca, tarjetas, estados vacíos, loaders, bottom nav móvil, sidebar, modales y métricas.

Puntos fuertes:

- Rutas lazy-loaded en `src/App.jsx`.
- Buen uso de React Context para compartir estado global.
- Formularios principales tienen validaciones básicas.
- Estados vacíos presentes en reportes, calendario, alertas, metas y transacciones.
- Login/register responsive sin overflow horizontal a 390px.
- Exportación de reportes en CSV, Excel y PDF.

Problemas:

- Las páginas hacen demasiado: UI, cálculos, filtros, exportación, persistencia y reglas de negocio.
- Falta una capa `services/` para Firestore y una capa `hooks/` para queries y mutaciones.
- No hay TypeScript ni tipado runtime consistente para entidades como Transaction, Budget, Category, Notification.
- No hay error boundaries para fallos de página o lazy imports.
- Faltan pruebas de componentes/páginas para flujos críticos.
- La navegación privada no pudo validarse con sesión real durante esta auditoría.
- En pantallas financieras densas, algunos controles se ven funcionales pero no completamente premium: filtros, selects y tablas podrían ser más consistentes.
- El diseño visual abusa un poco de sombras, gradientes y radios grandes; conviene reducir ruido para una app financiera más ejecutiva.

## 7. Revisión del backend

No hay backend tradicional. La arquitectura backend efectiva es:

- Firebase Auth para identidad.
- Firestore como base de datos.
- Firestore Rules como autorización.
- Contextos React como capa de acceso y mutación.

Puntos positivos:

- `firestore.rules` valida ownership con `request.auth.uid`.
- Las reglas limitan campos permitidos con `keys().hasOnly`.
- Hay validaciones de tipo, longitud y montos.
- Cada documento guarda `uid` y las queries filtran por usuario.

Problemas:

- No hay servicios backend para operaciones sensibles como eliminación total de cuenta, migraciones, auditoría, backups o mantenimiento.
- La eliminación de cuenta se hace desde cliente; si falla la limpieza parcial, puede dejar documentos huérfanos.
- No hay pruebas automatizadas de reglas Firestore con emulador.
- Las fechas mezclan `serverTimestamp()` en perfil y `new Date().toISOString()` en presupuestos/notificaciones. Conviene estandarizar.
- No hay rate limiting propio para acciones como crear notificaciones, categorías o transacciones; se depende de Firebase.
- No hay índices/queries paginadas para grandes volúmenes.
- No hay capa de validación compartida entre cliente y reglas; las reglas y `src/utils/validation.js` pueden divergir.

## 8. Revisión de integración frontend-backend

Conectado:

- Auth: login, registro, logout, reset password, email verification, reauth, update profile/password/email.
- Perfil: colección `users`.
- Transacciones: colección `transactions`.
- Categorías: colección `categories`.
- Métodos de pago: colección `paymentMethods`.
- Metas: colección `budgets`.
- Alertas: colección `notifications`.
- Preferencias de alerta: documento `notificationSettings/{uid}`.

Falta o está incompleto:

- Paginación real de notificaciones (`loadMoreNotifications`).
- Paginación/filtros en servidor para transacciones y reportes.
- Pruebas E2E reales con cuenta verificada.
- Validación automatizada de reglas Firestore.
- Manejo centralizado de errores de Firebase.
- Limpieza de datos de cuenta desde entorno confiable.

Endpoints no usados:

- No aplica en REST/HTTP porque no hay API propia.
- Todas las colecciones declaradas en reglas parecen tener uso desde cliente.

Pantallas con datos mock:

- No se encontraron pantallas principales usando datos mock fijos. Lo que existe son estados vacíos y cálculos derivados de Firestore.

## 9. Mejoras recomendadas

Prioridad alta:

- Mover `firebaseConfig` a `import.meta.env.VITE_FIREBASE_*` y fallar de forma clara si falta configuración.
- Cambiar eliminación de cuenta para no borrar Auth si falla la limpieza, o mover limpieza a Cloud Function/Admin SDK.
- Crear tests de Firestore Rules con Firebase Emulator.
- Activar E2E real con cuenta dedicada verificada y datos aislados.
- Dividir `Settings.jsx`, `Dashboard.jsx`, `Reports.jsx` y `Budgets.jsx`.
- Implementar servicios Firestore: `transactionService`, `budgetService`, `notificationService`, `userService`.

Prioridad media:

- Crear hooks de dominio: `useTransactions`, `useBudgets`, `useNotifications`, `useReports`.
- Añadir paginación real y `orderBy/limit` para transacciones y notificaciones.
- Centralizar funciones financieras duplicadas en `src/utils/finance.js`.
- Añadir error boundaries y estados de error por página.
- Estandarizar fechas y timestamps.
- Remover dependencias/assets no usados.

Prioridad visual/UX:

- Reducir gradientes/sombras en pantallas densas.
- Hacer filtros más compactos y consistentes.
- Mejorar tablas/listas de reportes y transacciones para sensación premium.
- Añadir skeletons o estados de carga por sección.
- Revisar accesibilidad de botones icon-only y foco de modales.
- Añadir una vista de soporte/legal antes de lanzamiento público: privacidad, términos, contacto.

## 10. Plan de acción por fases

### Fase 1: Corrección de errores críticos

- Corregir eliminación de cuenta para evitar datos huérfanos.
- Crear cuenta E2E dedicada, verificada y aislada.
- Ejecutar E2E reales para login, transacciones, metas, settings y registro si procede.
- Migrar Firebase config a variables de entorno.
- Añadir manejo de error a todos los `onSnapshot`.

### Fase 2: Limpieza de código

- Eliminar `file-saver` si no se usará.
- Eliminar assets no usados.
- Archivar o fusionar `PLAN_3_FASES_NEXOFIN.md`.
- Extraer helpers duplicados de páginas hacia `src/utils`.
- Dividir `Settings.jsx` en componentes por pestaña.
- Dividir `Reports.jsx` en filtros, exportación, gráficos y tabla.

### Fase 3: Mejora de arquitectura

- Crear carpeta `src/services`.
- Crear carpeta `src/hooks`.
- Separar `AppContext` en providers más pequeños o hooks especializados.
- Definir contratos de datos comunes.
- Evaluar TypeScript para entidades financieras.
- Añadir Firebase Emulator para reglas y pruebas de integración.

### Fase 4: Mejora visual y UX/UI

- Auditar todas las pantallas autenticadas con datos reales.
- Refinar diseño de filtros, tablas, cards y modales.
- Reducir ruido visual en pantallas financieras.
- Mejorar estados loading/error/empty por módulo.
- Validar responsive completo: dashboard, transacciones, reportes, metas, settings y modales.
- Revisar accesibilidad con teclado y lectores de pantalla.

### Fase 5: Optimización, seguridad y pruebas

- Paginación y ordenamiento en Firestore.
- Índices necesarios para queries por `uid`, fecha, mes y estado.
- Tests E2E en CI con datos controlados.
- Tests de Firestore Rules.
- Error logging centralizado.
- Revisión de privacidad, términos y exportación/borrado de datos.
- Smoke test post-deploy en Vercel/Firebase Hosting.

## 11. Checklist final

- [ ] `src/firebase/config.js` usa variables `VITE_FIREBASE_*`.
- [ ] La app falla con mensaje claro si falta configuración Firebase.
- [ ] Eliminación de cuenta no deja datos huérfanos.
- [ ] Limpieza de cuenta se mueve a Cloud Function o se hace transaccionalmente antes de borrar Auth.
- [ ] E2E auth activado con cuenta dedicada.
- [ ] E2E registro activado solo en entorno controlado.
- [ ] Tests de Firestore Rules agregados.
- [ ] `Settings.jsx` dividido.
- [ ] `Dashboard.jsx` dividido.
- [ ] `Reports.jsx` dividido.
- [ ] `Budgets.jsx` dividido.
- [ ] Lógica financiera duplicada centralizada.
- [ ] `loadMoreNotifications` implementado o removido de UI.
- [ ] Transacciones usan paginación/ordenamiento en Firestore.
- [ ] Notificaciones usan paginación/ordenamiento en Firestore.
- [ ] Dependencia `file-saver` removida o usada.
- [ ] Assets no usados eliminados.
- [ ] Estados de error visibles para fallos Firebase.
- [ ] Modales accesibles con foco, Escape y labels consistentes.
- [ ] Diseño responsive probado con usuario autenticado.
- [ ] Reportes exportados probados con datos reales.
- [ ] CI ejecuta E2E reales en rama principal.
- [ ] Política de privacidad, términos y contacto definidos antes de producción pública.

## Verificación ejecutada

- `npm run lint`: pasó.
- `npm run test`: pasó, 35 tests.
- `npm run build`: pasó.
- `npm run e2e`: pasó técnicamente, pero 3 tests quedaron skipped por configuración.
- Navegación local en `http://localhost:5173`: login/register renderizan; rutas privadas redirigen a login sin sesión; sin errores de consola en rutas públicas revisadas.
- Responsive básico móvil de login/register a 390x844: sin overflow horizontal.
