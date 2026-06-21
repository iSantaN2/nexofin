# PLAN VISUAL CONSISTENCY - NexoFin

## Objetivo

Eliminar las inconsistencias visuales que aun quedan en acciones, botones, tarjetas de cuenta, modales y superficies de autenticacion para que NexoFin se vea como un solo sistema premium, claro y coherente.

Este plan debe seguirse a la letra.
No introducir nuevas variantes visuales fuera de este documento hasta terminarlo.

## Problema actual

Aunque la app ya convergio en gran parte al patron claro de `Alertas` y `Calendario`, todavia conviven varios estilos de accion:

1. botones primarios azul solido
2. botones principales con degradado azul-turquesa
3. botones hechos a mano por pagina fuera del componente `Button`
4. botones secundarios y de cierre de sesion con jerarquias distintas segun la pantalla

Eso hace que algunas vistas se sientan mas modernas que otras, incluso dentro de la misma pantalla.

## Resultado esperado

Al finalizar este plan:

1. todas las acciones principales usaran la misma jerarquia visual
2. los botones de cuenta y seguridad se sentiran parte del mismo sistema
3. los modales confirmatorios tendran el mismo lenguaje visual
4. no quedaran botones legacy construidos con clases manuales cuando deban usar primitives compartidas
5. no quedara codigo visual sobrante ni variantes sin uso real

## Patron visual oficial

### Accion principal

- degradado azul a turquesa
- texto blanco
- sombra suave
- hover con ligera elevacion
- uso: guardar, actualizar, continuar, confirmar acciones positivas

### Accion secundaria

- fondo blanco o azul muy suave
- borde delicado
- texto azul oscuro
- uso: cancelar, volver, editar no critica, cerrar panel

### Accion neutra

- fondo gris suave
- texto oscuro
- uso: acciones auxiliares sin peso principal

### Accion destructiva

- rojo solido
- texto blanco
- uso: eliminar cuenta, borrar registros, confirmar acciones irreversibles

### Regla critica

No mezclar azul solido como CTA principal si ya existe variante `brand` con degradado.

## Hallazgos detectados

### 1. Sistema de botones duplicado

El componente [`src/components/ui/Button.jsx`](C:\Users\iSanaN2\finapp\src\components\ui\Button.jsx) ya tiene variantes `primary`, `brand`, `danger`, `soft`, `neutral`, `outline`, pero hoy:

- `primary` sigue siendo azul solido
- `brand` usa el degradado premium
- varias pantallas siguen usando `primary` para acciones que visualmente deberian ser `brand`

### 2. Ajustes tiene mezcla de jerarquias

En [`src/components/settings/ProfileSettings.jsx`](C:\Users\iSanaN2\finapp\src\components\settings\ProfileSettings.jsx):

- `Guardar identidad` usa `primary`
- `Guardar datos personales` usa `soft`
- `Actualizar correo` usa `primary`
- `Actualizar contrasena` usa `brand`

La pantalla ya se ve bien estructurada, pero los CTA no hablan el mismo idioma visual.

### 3. Cerrar sesion compite con el sistema nuevo

En la tarjeta lateral de cuenta de [`src/App.jsx`](C:\Users\iSanaN2\finapp\src\App.jsx), `Cerrar sesion` sigue con azul solido.

Se siente mas antiguo que el resto del lenguaje premium actual.

### 4. Aun hay botones hechos a mano

Persisten acciones construidas con clases manuales en lugar de usar `Button`, especialmente en:

- [`src/pages/Transactions.jsx`](C:\Users\iSanaN2\finapp\src\pages\Transactions.jsx)
- [`src/pages/Reports.jsx`](C:\Users\iSanaN2\finapp\src\pages\Reports.jsx)
- [`src/pages/Dashboard.jsx`](C:\Users\iSanaN2\finapp\src\pages\Dashboard.jsx)
- [`src/pages/Calendar.jsx`](C:\Users\iSanaN2\finapp\src\pages\Calendar.jsx)
- [`src/pages/Budgets.jsx`](C:\Users\iSanaN2\finapp\src\pages\Budgets.jsx)
- [`src/components/AddTransactionModal.jsx`](C:\Users\iSanaN2\finapp\src\components\AddTransactionModal.jsx)
- [`src/components/ConfirmModal.jsx`](C:\Users\iSanaN2\finapp\src\components\ConfirmModal.jsx)

### 5. Superficies de cuenta y auth aun pueden alinearse mejor

Hay que revisar consistencia entre:

- `VerifyEmail`
- login / register / onboarding
- sidebar account card
- resumen de cuenta en ajustes

No para redisenar el flujo, sino para cerrar diferencias de tono visual.

## Regla de ejecucion

No avanzar de fase hasta completar la anterior.

Despues de cada bloque:

- `npm run lint`
- `npm run test`
- `npm run build`

Corregir cualquier error nuevo antes de continuar.

## Fase 1 - Congelar jerarquia de acciones

### Objetivo

Definir una sola jerarquia oficial de botones y acciones.

### Tareas

1. Confirmar `brand` como CTA principal global.
2. Reservar `danger` solo para destruccion.
3. Reservar `soft`, `outline` o `neutral` para secundarias.
4. Decidir si `primary`:
   - se elimina
   - o se redefine para no competir con `brand`

### Criterio de cierre

Queda una sola verdad para CTA, secundarias y peligro.

## Fase 2 - Ajustes y cuenta

### Objetivo

Dejar perfecta la pantalla de configuracion, que hoy es la que mejor deja ver las inconsistencias de acciones.

### Tareas

1. Unificar CTA de:
   - guardar identidad
   - guardar datos personales
   - actualizar correo
   - actualizar contrasena
2. Ajustar `Cerrar sesion` del sidebar para que comparta el mismo lenguaje premium.
3. Validar que `Quitar foto`, `Cancelar` y acciones auxiliares mantengan jerarquia secundaria.
4. Mantener `Eliminar cuenta` solo como accion roja.

### Criterio de cierre

`Ajustes` debe quedar visualmente consistente de arriba abajo sin mezcla de CTA.

## Fase 3 - Auth y verificacion

### Objetivo

Hacer que las superficies de acceso y cuenta se sientan hermanas del resto de la app.

### Tareas

1. Revisar `VerifyEmail`:
   - CTA principal
   - reenviar correo
   - cerrar sesion
2. Revisar `Login`, `Register` y `Onboarding`:
   - consistencia de botones
   - consistencia de labels
   - misma sensacion premium del sistema claro
3. Verificar que no existan botones azules legacy aislados.

### Criterio de cierre

Todo el flujo de entrada se ve parte del mismo producto.

## Fase 4 - Migracion de botones manuales

### Objetivo

Reducir deuda visual y dejar de depender de estilos hechos a mano cuando ya existe primitive compartida.

### Tareas

1. Revisar y migrar acciones manuales en:
   - `Dashboard`
   - `Transactions`
   - `Reports`
   - `Budgets`
   - `Calendar`
2. Revisar FAB, acciones inline, acciones de filtros y acciones de exportacion.
3. Mantener excepciones solo cuando el patron realmente sea distinto y este justificado.

### Criterio de cierre

La mayoria de acciones reutiliza `Button` o una primitive equivalente y no clases repetidas por pagina.

## Fase 5 - Modales y confirmaciones

### Objetivo

Hacer que los overlays y confirmaciones no parezcan un sistema separado.

### Tareas

1. Revisar `ConfirmModal`.
2. Revisar modal de transacciones.
3. Revisar confirmacion de eliminacion de cuenta.
4. Unificar:
   - CTA principal del modal
   - boton cancelar
   - boton destructivo
   - espaciado y pesos visuales

### Criterio de cierre

Todos los modales comparten la misma jerarquia de accion.

## Fase 6 - Limpieza de codigo sobrante

### Objetivo

Eliminar rastros del sistema visual anterior o de variantes que ya no tengan lugar.

### Tareas

1. Eliminar clases duplicadas reemplazadas por `Button`.
2. Eliminar variantes de boton que ya no tengan uso real.
3. Eliminar combinaciones de color legacy si dejaron de existir.
4. Revisar imports y helpers visuales sin uso.

### Criterio de cierre

No queda codigo visual muerto ni caminos paralelos innecesarios.

## Orden obligatorio

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6

## Decision recomendada

La mejor direccion hoy es:

- `brand` como accion principal global
- `danger` para borrar o destruir
- `soft` / `outline` para secundarias
- retirar gradualmente el uso de `primary` azul solido en CTA importantes

## Nota final

Este plan no cambia funcionalidades.
Solo corrige jerarquia visual, consistencia y limpieza de implementacion.
