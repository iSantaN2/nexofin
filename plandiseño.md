# PLAN DE DISENO - NexoFin

## Objetivo

Unificar toda la experiencia visual autenticada de NexoFin bajo el patron claro y premium ya presente en `Alertas` y `Calendario`, manteniendo compatibilidad funcional completa y eliminando al final todo codigo visual obsoleto, duplicado o sin uso.

Este plan debe seguirse a la letra.
No agregar nuevas lineas visuales fuera de este documento mientras el plan este en ejecucion.

## Regla principal

El patron maestro de diseno sera:

- `Alertas`
- `Calendario`

Todo lo demas debe converger hacia ese lenguaje visual.

## Principios obligatorios

1. No cambiar funcionalidades existentes.
2. No mezclar el estilo hero oscuro anterior con el patron claro nuevo.
3. No dejar variantes visuales antiguas conviviendo con las nuevas si ya no se usan.
4. Cada migracion visual debe terminar con limpieza de codigo relacionado.
5. Despues de cada bloque:
   - ejecutar `npm run lint`
   - ejecutar `npm run test`
   - ejecutar `npm run build`
   - corregir cualquier error antes de seguir

## Resultado esperado

Al finalizar:

- `Inicio`
- `Transacciones`
- `Reportes`
- `Metas`
- `Ajustes`

deben verse parte del mismo sistema visual que `Alertas` y `Calendario`.

La app debe sentirse:

- clara
- premium
- coherente
- legible
- moderna

## Sistema visual objetivo

### 1. Hero global

Todas las pantallas autenticadas deben usar el mismo tipo de hero:

- fondo claro
- borde suave
- acento superior azul/verde
- sombra sutil
- badge pequeno superior
- titulo oscuro de alto contraste
- subtitulo corto y legible

Eliminar heroes oscuros o pesados anteriores.

### 2. Tarjetas metricas

Todas las metricas deben compartir:

- radio consistente
- fondo blanco o tinte muy suave
- borde delicado
- titulo pequeno gris azulado
- valor principal con alto contraste
- color semantico solo cuando agregue significado

### 3. Tipografia

Unificar:

- tamano de titulos
- pesos de subtitulos
- color de labels
- contraste de textos
- espaciados verticales

No dejar texto oscuro sobre fondos oscuros.

### 4. Paneles y secciones

Todos los paneles internos deben alinearse al mismo patron:

- fondo claro
- borde sutil
- sombra minima
- encabezados consistentes
- espaciado uniforme

### 5. Colores

Definir uso consistente:

- azul: marca y neutral principal
- verde: positivo
- rojo: riesgo/perdida
- ambar: atencion
- gris azulado: texto secundario

No usar bloques azules pesados como base principal de lectura.

## Alcance exacto

### Pantallas objetivo

1. `Inicio`
2. `Transacciones`
3. `Reportes`
4. `Metas`
5. `Ajustes`

### Pantallas referencia

1. `Alertas`
2. `Calendario`

### Componentes base a unificar

1. `PageHero`
2. `MetricCard`
3. `SectionPanel`
4. chips y badges
5. estados vacios
6. cabeceras de paneles

## Fase A - Congelar direccion visual

### Objetivo

Tomar `Alertas` y `Calendario` como patron oficial.

### Tareas

1. Revisar estilos visuales reales usados por ambos.
2. Identificar diferencias respecto a:
   - `Inicio`
   - `Transacciones`
   - `Reportes`
   - `Metas`
   - `Ajustes`
3. Documentar los tokens visuales de facto:
   - fondos
   - bordes
   - radios
   - sombras
   - paddings
   - jerarquia tipografica

### Criterio de cierre

Queda claro un unico lenguaje visual objetivo antes de editar paginas.

## Fase B - Unificar primitives visuales

### Objetivo

Hacer que los componentes base soporten el sistema claro de manera consistente.

### Tareas

1. Ajustar `PageHero` para que refleje el patron claro oficial.
2. Ajustar `MetricCard` para fondo claro, legibilidad y estados consistentes.
3. Ajustar `SectionPanel` para el mismo lenguaje visual.
4. Revisar badges, indicadores y encabezados secundarios.
5. Verificar que las primitives no conserven variantes oscuras innecesarias.

### Criterio de cierre

Las piezas base ya permiten construir todas las pantallas objetivo sin recurrir a estilos legacy.

## Fase C - Migracion visual por pantalla

### Orden obligatorio

1. `Inicio`
2. `Transacciones`
3. `Reportes`
4. `Metas`
5. `Ajustes`

### Regla

No pasar a la siguiente pantalla hasta que la actual quede:

- visualmente alineada
- validada
- sin estilos residuales evidentes

### En cada pantalla hacer

1. Migrar hero al patron claro.
2. Migrar tarjetas metricas al patron claro.
3. Ajustar jerarquia tipografica.
4. Corregir contraste y legibilidad.
5. Unificar paneles y bloques secundarios.
6. Revisar mobile y desktop.

### Criterio de cierre por pantalla

- misma familia visual que `Alertas` y `Calendario`
- ningun texto con contraste deficiente
- ninguna tarjeta heredada del estilo oscuro

## Fase D - Normalizacion global

### Objetivo

Eliminar pequenas inconsistencias entre pantallas ya migradas.

### Tareas

1. Comparar todas las pantallas autenticadas lado a lado.
2. Igualar:
   - alturas de heroes
   - paddings
   - radios
   - espaciados entre bloques
   - labels de metricas
   - colores de texto
3. Revisar que no haya mezclas de tonos o pesos tipograficos arbitrarios.

### Criterio de cierre

La app completa se siente un solo producto, no una suma de pantallas distintas.

## Fase E - Limpieza de codigo sobrante

### Objetivo

Eliminar todo rastro del sistema visual anterior que ya no sea necesario.

### Tareas obligatorias

1. Borrar variantes oscuras no usadas.
2. Borrar clases condicionales antiguas si quedaron sin uso.
3. Borrar componentes auxiliares reemplazados por primitives nuevas.
4. Borrar props visuales obsoletas.
5. Borrar estilos duplicados o muertos.
6. Borrar imports sin uso.
7. Borrar constantes visuales legacy.
8. Revisar que no queden comentarios describiendo disenos ya eliminados.

### Regla critica

Si un bloque, variante, helper o estilo ya no participa en la UI final, debe eliminarse.
No dejar codigo "por si acaso".

### Criterio de cierre

El codigo refleja exactamente el diseno final, sin restos del sistema viejo.

## Fase F - Validacion final visual y tecnica

### Validaciones tecnicas

Despues del cierre visual:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

### Validaciones visuales

Revisar al menos:

1. `Inicio`
2. `Transacciones`
3. `Reportes`
4. `Metas`
5. `Ajustes`
6. `Alertas`
7. `Calendario`

### Revisar explicitamente

1. contraste de titulos
2. legibilidad de subtitulos
3. consistencia de metricas
4. coherencia de paneles
5. equilibrio visual en movil
6. ausencia de heroes oscuros viejos

## Prohibiciones

1. No agregar un tercer estilo visual.
2. No dejar coexistiendo el hero oscuro y el hero claro en pantallas equivalentes.
3. No introducir cambios funcionales para compensar problemas de diseno.
4. No mantener codigo viejo sin uso despues de migrar.
5. No cerrar el trabajo sin limpieza visual y tecnica.

## Definicion de terminado

El plan se considera completado solo si:

1. las cinco pantallas objetivo siguen el patron claro
2. `Alertas` y `Calendario` siguen siendo consistentes con ellas
3. no quedan restos visibles del estilo oscuro anterior
4. no queda codigo visual sobrante o muerto
5. `lint`, `test` y `build` terminan en verde
