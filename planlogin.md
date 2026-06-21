# PLAN LOGIN / REGISTRO / PERFIL - NexoFin

## Objetivo

Definir el flujo final de:

- registro
- login
- onboarding inicial
- perfil de usuario
- tarjeta visual de cuenta

para que NexoFin reduzca friccion de entrada, mejore identidad del usuario dentro de la app y mantenga una estructura de datos lista para produccion.

Este plan debe seguirse a la letra.
No agregar campos, pasos ni validaciones nuevas fuera de este documento mientras el plan este en ejecucion.

## Problema que resuelve

Hoy NexoFin mezcla datos que deberian vivir en momentos distintos del recorrido:

- datos minimos para entrar
- datos financieros para configurar la experiencia
- datos personales para completar el perfil

Eso genera dudas de UX, hace que el registro pueda crecer mas de la cuenta y deja la identidad del usuario poco humana dentro de la app.

## Resultado esperado

Al finalizar este plan:

1. el registro sera corto y claro
2. el onboarding pedira solo lo necesario para personalizar la app financiera
3. el perfil tendra una estructura progresiva y premium
4. la tarjeta de cuenta mostrara alias y foto como identidad principal
5. el correo dejara de ser el dato dominante en la UI
6. no se pediran datos personales sin un uso claro

## Principio rector

Separar el recorrido en tres niveles:

1. acceso
2. configuracion financiera inicial
3. perfil ampliado

No mezclar esos tres niveles en un mismo formulario.

## Reglas obligatorias

1. El registro inicial debe tener la menor friccion posible.
2. Solo pedir en cada etapa los datos necesarios para esa etapa.
3. No hacer obligatorios datos personales que no afecten el uso central de NexoFin.
4. El alias debe ser la identidad principal visible dentro de la app.
5. La foto de perfil debe reemplazar el avatar generico si existe.
6. El correo debe mostrarse como dato secundario, no como protagonista.
7. La moneda debe seguir siendo obligatoria para una experiencia financiera correcta.
8. No introducir campos sin definir antes su uso real.

## Modelo funcional objetivo

### Nivel 1 - Registro inicial

Este paso solo debe servir para crear la cuenta y permitir que el usuario entre rapido.

### Campos obligatorios en registro

- correo
- contrasena
- alias visible

### Campos prohibidos en registro inicial

- nombres completos
- apellidos completos
- numero de celular
- direccion
- genero / sexo
- foto de perfil

### Justificacion

El registro debe optimizar conversion y velocidad.
Mientras mas campos tenga este primer paso, mayor abandono va a existir.

## Nivel 2 - Onboarding inicial

Este paso ocurre despues del login o verificacion y sirve para configurar la experiencia financiera minima.

### Campos obligatorios en onboarding

- moneda

### Campos recomendados en onboarding

- alias, solo si no se pidio en registro o si el usuario quiere ajustarlo

### Campos opcionales en onboarding

- pais o region, solo si luego servira para formato, moneda o reglas locales

### Campos que no deben entrar aqui por ahora

- direccion
- genero / sexo
- foto
- celular
- nombres legales

### Justificacion

El onboarding debe dejar lista la app para usarse, no convertirse en una ficha personal larga.

## Nivel 3 - Perfil progresivo

Esta capa vive en `Ajustes > Perfil`.
Su objetivo es enriquecer la identidad del usuario sin bloquear el uso del producto.

### Campos opcionales del perfil

- nombres
- apellidos
- numero de celular
- foto de perfil
- direccion

### Campos en revision

- genero / sexo

### Regla critica sobre genero / sexo

No pedirlo ni guardarlo como campo relevante hasta definir para que servira.
Si no tiene uso funcional, legal o analitico real, debe excluirse.

### Regla critica sobre direccion

No volverla obligatoria mientras NexoFin no tenga:

- facturacion
- reportes fiscales
- integraciones legales o bancarias
- logica por ubicacion

## Identidad visible del usuario

### Orden visual correcto en UI

1. foto de perfil
2. alias
3. correo

### Regla de fallback

Si no existe foto:

- mostrar avatar con inicial del alias
- usar correo solo como respaldo secundario

### Regla de nombre visible

El alias sera el nombre principal que se mostrara en:

- tarjeta de cuenta
- sidebar
- encabezados de perfil
- resumen de usuario

Los nombres y apellidos completos no deben reemplazar automaticamente el alias dentro de la UI principal.

## Tarjeta de cuenta objetivo

La tarjeta de cuenta en ajustes debe mostrar:

- foto del usuario si existe
- alias en grande
- correo en texto secundario
- estado de cuenta
- acceso a completar perfil si faltan datos

### Lo que debe desaparecer

- avatar generico fijo si ya existe foto
- correo como texto principal dominante
- identidad visual basada solo en inicial si ya hay alias y foto

## Campos y prioridad

### Obligatorios

- correo
- contrasena
- alias visible
- moneda

### Opcionales

- nombres
- apellidos
- celular
- foto
- direccion

### No definidos / no incluir aun

- genero / sexo
- cualquier otro dato sin uso real actual

## Estructura conceptual de datos

### Cuenta base

- email
- password auth
- alias
- emailVerified
- createdAt

### Preferencias iniciales

- currency
- onboardingCompleted

### Perfil ampliado

- firstName
- lastName
- phone
- photoURL
- address

## Fase A - Congelar decision funcional

### Objetivo

Cerrar definitivamente que informacion pertenece a:

- registro
- onboarding
- perfil

### Tareas

1. Confirmar alias como campo principal visible.
2. Confirmar moneda como obligatoria.
3. Confirmar datos personales como opcionales.
4. Excluir genero / sexo hasta que exista caso de uso real.

### Criterio de cierre

Ya no hay ambiguedad sobre que se pide en cada paso.

## Fase B - Redisenar flujo de acceso

### Objetivo

Separar bien:

- crear cuenta
- iniciar sesion
- verificar correo
- completar onboarding

### Tareas

1. Mantener login enfocado solo en acceso.
2. Hacer que registro cree cuenta con el minimo de campos.
3. Enviar a onboarding despues del alta/verificacion segun el flujo actual.
4. Evitar que perfil ampliado aparezca en registro.

### Criterio de cierre

El acceso deja de competir con datos personales que no corresponden a ese momento.

## Fase C - Onboarding financiero minimo

### Objetivo

Configurar la app para que funcione bien desde el primer uso.

### Tareas

1. Mantener moneda como paso obligatorio.
2. Permitir confirmar o ajustar alias si hace falta.
3. Mantener el onboarding corto y orientado al uso financiero.

### Criterio de cierre

Al salir del onboarding, el usuario ya puede usar NexoFin sin ruido innecesario.

## Fase D - Perfil premium progresivo

### Objetivo

Transformar `Ajustes > Perfil` en un lugar de identidad real y no solo de datos tecnicos.

### Tareas

1. Agregar soporte para foto de perfil.
2. Incorporar campos opcionales de identidad.
3. Mostrar nivel de perfil completado si aporta claridad.
4. Mantener cada dato personal como opcional salvo que exista uso justificado.

### Criterio de cierre

El perfil se siente humano, premium y util, sin bloquear el producto.

## Fase E - Tarjeta de cuenta y presencia visual

### Objetivo

Hacer que el bloque de cuenta represente a una persona y no solo a un correo.

### Tareas

1. Mostrar foto si existe.
2. Mostrar alias como encabezado principal.
3. Bajar correo a segundo nivel.
4. Mantener fallback robusto con avatar por inicial.
5. Evitar repetir visualmente los mismos datos en exceso.

### Criterio de cierre

La cuenta se siente personalizada y coherente con una app financiera premium.

## Fase F - Validacion funcional y de producto

### Revisar explicitamente

1. friccion de registro
2. claridad del onboarding
3. comprension del alias
4. valor real de cada campo pedido
5. coherencia entre perfil y tarjeta de cuenta
6. consistencia entre desktop, tablet y movil

### Pregunta de control obligatoria

Cada campo debe responder:

"Por que NexoFin necesita este dato en este momento?"

Si no hay respuesta clara, el campo no entra.

## Prohibiciones

1. No volver el registro una ficha extensa.
2. No pedir datos personales por intuicion.
3. No usar el correo como identidad principal visible una vez exista alias.
4. No mezclar onboarding financiero con perfil personal.
5. No agregar genero / sexo sin caso de uso definido.
6. No hacer obligatoria la direccion sin necesidad funcional real.

## Definicion de terminado

Este plan se considera completo solo si:

1. el registro queda corto
2. el onboarding queda financiero y minimo
3. el perfil queda progresivo
4. la tarjeta de cuenta muestra alias y foto como identidad principal
5. los datos personales opcionales quedan claramente separados
6. no quedan decisiones ambiguas sobre que pedir y cuando pedirlo
