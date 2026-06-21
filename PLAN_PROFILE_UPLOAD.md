# PLAN PROFILE UPLOAD - NexoFin

## Objetivo

Implementar una experiencia completa y premium de:

- foto de perfil real
- identidad visible del usuario
- onboarding refinado
- perfil progresivo

sin dejar codigo temporal, flujos duplicados o interfaces provisionales una vez terminada la ejecucion.

Este plan debe seguirse a la letra.
No agregar nuevas variantes, campos ni soluciones intermedias fuera de este documento mientras el plan este en ejecucion.

## Problema que resuelve

Hoy NexoFin ya tiene:

- alias visible
- correo como dato secundario
- estructura inicial de perfil

pero aun quedan elementos provisionales o incompletos:

- la foto de perfil se carga por URL manual
- el onboarding puede sentirse demasiado vacio o redundante
- no existe una experiencia real de seleccion de imagen desde dispositivo
- no hay flujo premium de preview, cambio o eliminacion de foto
- pueden quedar restos de logica temporal cuando se implemente la version definitiva

## Resultado esperado

Al finalizar este plan:

1. el usuario podra subir una foto real desde galeria o archivo
2. la foto tendra preview antes de guardarse
3. el usuario podra cambiar o eliminar su foto
4. la tarjeta de cuenta mostrara foto real cuando exista
5. el onboarding se sentira breve pero completo
6. el alias no se pedira de forma redundante
7. el sistema no conservara campos o flujos provisionales de foto por URL
8. no quedara codigo sobrante del enfoque temporal anterior

## Principio rector

La identidad del usuario debe sentirse:

- humana
- simple
- segura
- premium

sin aumentar friccion innecesaria en el acceso inicial.

## Reglas obligatorias

1. No volver a pedir alias como requisito duplicado despues del registro.
2. No usar URL manual como solucion final de foto.
3. La foto debe poder cargarse desde dispositivo real.
4. La experiencia debe funcionar bien en movil, tablet y desktop.
5. Toda imagen subida debe validarse antes de persistir.
6. La UI debe mostrar preview antes de confirmar guardado.
7. El usuario debe poder eliminar la foto y volver al avatar fallback.
8. Todo codigo temporal de la implementacion actual debe eliminarse al final.

## Modelo funcional objetivo

### Registro

Se mantiene corto:

- alias
- correo
- contrasena

### Verificacion de correo

Se mantiene como paso de seguridad sin mezclar datos de perfil.

### Onboarding refinado

Debe pedir como obligatorio:

- moneda principal

Debe mostrar, pero no exigir nuevamente:

- alias visible ya definido

Puede permitir edicion opcional del alias, pero sin presentarlo como un segundo registro.

### Perfil en ajustes

Debe concentrar:

- foto de perfil
- alias
- datos personales opcionales
- seguridad
- zona de peligro

## Foto de perfil - experiencia final

### Flujo correcto

1. usuario toca `Subir foto`
2. selecciona archivo desde galeria o explorador
3. ve preview antes de guardar
4. puede confirmar o cancelar
5. la imagen se sube y se refleja en la UI

### Acciones soportadas

- subir foto
- reemplazar foto
- eliminar foto
- cancelar cambio antes de guardar

### Fallback

Si no existe foto:

- mostrar avatar por inicial del alias

### Error handling

La UI debe manejar:

- archivo invalido
- archivo demasiado pesado
- fallo de subida
- imagen corrupta o no renderizable

## Reglas de archivo

### Formatos permitidos

- jpg
- jpeg
- png
- webp

### Restricciones

- definir peso maximo claro
- definir dimensiones maximas de procesamiento
- no aceptar archivos no imagen

### Optimizacion

Antes de subir:

- redimensionar si hace falta
- comprimir si hace falta
- normalizar formato si mejora rendimiento

## Infraestructura esperada

### Persistencia

La foto debe vivir en una solucion real de almacenamiento, no en texto manual.

### Direccion esperada

Usar almacenamiento por usuario con estructura segura, por ejemplo:

- `users/{uid}/profile/avatar`

### Seguridad

Cada usuario solo debe:

- subir su propia foto
- leer su propia foto
- reemplazar su propia foto
- borrar su propia foto

### Sincronizacion

La URL final de la foto debe quedar reflejada en el perfil del usuario para:

- sidebar
- ajustes
- tarjeta de cuenta
- cualquier vista futura que use identidad visible

## Onboarding refinado

### Objetivo

Hacer que el onboarding no se sienta vacio, pero tampoco redundante.

### Contenido esperado

1. bienvenida breve
2. alias visible ya preparado
3. moneda principal obligatoria
4. pequena vista previa de identidad dentro de NexoFin

### Regla critica

El alias puede aparecer como:

- lectura
- previsualizacion
- edicion opcional

pero no como obligacion repetida si ya fue definido en registro.

## Perfil progresivo premium

### Bloques esperados

1. identidad visible
2. datos personales opcionales
3. seguridad de cuenta
4. zona de peligro

### Datos opcionales

- nombres
- apellidos
- celular
- direccion

### Datos fuera de alcance por ahora

- genero / sexo si no existe uso claro

## Tarjeta de cuenta objetivo

La tarjeta principal debe mostrar:

- foto si existe
- alias en grande
- correo como secundario
- estado de cuenta

### No debe mostrar como prioridad

- correo encima del alias
- avatar generico si ya hay foto
- campos tecnicos innecesarios

## Limpieza obligatoria al terminar

### Debe eliminarse

1. campo de URL manual de foto
2. helpers temporales que solo existan para esa solucion
3. estados o props que ya no se usen
4. textos de ayuda ligados a la carga por URL
5. flujos redundantes del alias en onboarding
6. imports, validaciones y constantes sin uso
7. codigo muerto de preview o upload descartado durante la implementacion

### Regla critica

No dejar nada "por si acaso".
El codigo final debe reflejar solo la experiencia definitiva.

## Fase A - Congelar UX de identidad

### Objetivo

Cerrar exactamente como debe sentirse:

- onboarding
- tarjeta de cuenta
- perfil visible
- foto de usuario

### Tareas

1. Confirmar alias como identidad principal.
2. Confirmar correo como dato secundario.
3. Confirmar foto real como comportamiento oficial.
4. Confirmar que onboarding no repite el registro.

### Criterio de cierre

No quedan dudas sobre la experiencia final del usuario.

## Fase B - Infraestructura de foto

### Objetivo

Preparar almacenamiento, validacion y persistencia real de imagen.

### Tareas

1. Definir servicio de almacenamiento de foto.
2. Definir reglas de seguridad.
3. Definir convencion de rutas por usuario.
4. Definir como persistir la URL final en el perfil.

### Criterio de cierre

La app ya tiene base tecnica para soportar foto real de forma segura.

## Fase C - Flujo de carga y preview

### Objetivo

Construir la experiencia completa de seleccion de imagen.

### Tareas

1. Selector de archivo real.
2. Preview local antes de guardar.
3. Validacion de formato y peso.
4. Guardado final.
5. Cambio y eliminacion de foto.

### Criterio de cierre

El usuario puede gestionar su foto sin pasos raros ni soluciones manuales.

## Fase D - Refinar onboarding

### Objetivo

Quitar redundancia y reforzar sensacion de producto.

### Tareas

1. Dejar moneda como obligatoria.
2. Mostrar alias ya creado.
3. Permitir editar alias solo de forma opcional.
4. Agregar micro preview de identidad.

### Criterio de cierre

El onboarding ya no se siente vacio ni repetitivo.

## Fase E - Perfil premium final

### Objetivo

Alinear identidad visible, datos opcionales y seguridad en una sola experiencia coherente.

### Tareas

1. Integrar foto real en tarjeta y sidebar.
2. Ajustar formularios de identidad.
3. Mantener datos personales como opcionales.
4. Revisar estados vacios y fallbacks.

### Criterio de cierre

La experiencia de perfil se siente terminada, humana y premium.

## Fase F - Limpieza total

### Objetivo

Eliminar restos del enfoque temporal anterior.

### Tareas

1. Borrar URL manual de foto.
2. Borrar codigo provisional de identidad.
3. Borrar duplicaciones del alias.
4. Borrar ayudas de interfaz que ya no correspondan.
5. Revisar compatibilidad final sin restos.

### Criterio de cierre

No queda huella de la solucion temporal.

## Fase G - Validacion final

### Validaciones tecnicas obligatorias

Despues de cada bloque relevante y al final:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

### Validaciones funcionales obligatorias

1. crear cuenta
2. verificar correo
3. onboarding
4. cargar foto
5. cambiar foto
6. eliminar foto
7. revisar ajustes
8. revisar sidebar
9. revisar tablet y movil

## Prohibiciones

1. No dejar la foto por URL como solucion final.
2. No repetir alias como requisito en dos pasos seguidos.
3. No guardar archivos sin validacion minima.
4. No subir imagenes sin reglas de acceso por usuario.
5. No cerrar el trabajo dejando codigo sobrante.
6. No mezclar datos opcionales con obligatorios sin razon clara.

## Definicion de terminado

Este plan se considera completo solo si:

1. la foto se sube desde dispositivo real
2. existe preview antes de guardar
3. el usuario puede cambiar y eliminar la foto
4. onboarding queda breve pero no vacio
5. alias no se repite de forma torpe
6. la cuenta muestra foto y alias como identidad principal
7. no quedan restos de la solucion temporal por URL
8. `lint`, `test` y `build` quedan en verde
