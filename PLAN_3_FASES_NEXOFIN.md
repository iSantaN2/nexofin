# Plan 3 Fases - NexoFin

## Fase 1 (Base de Produccion)
- Seguridad Firestore por propiedad (`uid`) y validacion de esquema.
- Validacion y saneo de datos en cliente antes de escribir.
- Correccion de errores de codificacion/textos y UX de errores.
- Checklist manual de QA: registro, login, CRUD, filtros, reportes, calendarios.

Estado: `en progreso`

## Fase 2 (Calidad y Rendimiento)
- Tests unitarios para calculos y filtros.
- Tests E2E para flujos criticos (auth + transacciones + presupuestos).
- Optimizacion de bundle y carga por rutas (`lazy loading`).
- Paginacion real en Firestore donde aplique.

Estado: `pendiente`

## Fase 3 (Producto Pro)
- Notificaciones y recordatorios financieros.
- Reportes ejecutivos avanzados (mensual/trimestral/anual).
- Exportaciones con mejor formato (branding NexoFin).
- Backup / restore de datos por usuario.

Estado: `pendiente`
