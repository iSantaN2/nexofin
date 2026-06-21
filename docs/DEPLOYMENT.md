# Guia de despliegue de NexoFin

Esta guia deja el camino claro para publicar NexoFin sin exponer credenciales y sin romper rutas internas de React Router.

## 1. Preparacion local

Ejecuta:

```powershell
npm install
npm run quality
npm run e2e
npm run test:rules
```

Si `npm run e2e` esta configurado sin credenciales, los tests que dependen de Firebase Auth pueden quedar en skip. Para validar login real, usa una cuenta de testing dedicada.

`npm run test:rules` requiere JDK 21 o superior porque Firebase Emulator ya no soporta runtimes Java anteriores.

## 2. Firebase

Revisa en Firebase Console:

- Authentication > Sign-in method > Email/Password activado.
- Authentication > Settings > Authorized domains incluye tu dominio final.
- Firestore Database creado.
- Firestore Rules publicado con el contenido de `firestore.rules`.
- Firestore Indexes publicado con el contenido de `firestore.indexes.json`.

Antes de desplegar con CLI, vincula el repo a tu proyecto:

```powershell
firebase login
firebase use --add
```

Si quieres dejar una referencia local del proyecto por defecto, copia `.firebaserc.example` como `.firebaserc` y reemplaza el project id.

Para publicar reglas con Firebase CLI:

```powershell
npm run deploy:firestore:rules
```

Para publicar indices con Firebase CLI:

```powershell
npm run deploy:firestore:indexes
```

Para publicar ambos en un solo paso:

```powershell
npm run deploy:firestore
```

## 3. Vercel

Configuracion recomendada:

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Install command: `npm install` o automatico.

Variables requeridas:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

`vercel.json` se encarga de redirigir cualquier ruta interna hacia la app, por ejemplo `/transactions`, `/calendar`, `/settings` o `/notifications`.

## 4. Firebase Hosting

Configuracion incluida en `firebase.json`:

- Carpeta publica: `dist`.
- Rewrites SPA hacia `/index.html`.
- Reglas Firestore desde `firestore.rules`.
- Indices Firestore desde `firestore.indexes.json`.

Comandos:

```powershell
npm run build
npm run deploy:firestore
firebase deploy --only hosting
```

Indices compuestos obligatorios para evitar errores de lectura en produccion:

- `notifications`: `uid` ASC + `createdAt` DESC
- `transactions`: `uid` ASC + `createdAt` DESC

Si esos indices no estan construidos en Firebase, la app puede guardar datos pero fallar al cargar historial o alertas.

## 5. GitHub Actions

El pipeline debe quedar en verde antes de publicar.

Secrets recomendados para E2E real:

- `E2E_AUTH_ENABLED=true`
- `E2E_EMAIL=correo-de-testing`
- `E2E_PASSWORD=password-de-testing`

No uses tu cuenta principal. Crea una cuenta exclusiva de testing en Firebase Auth, verifica el correo y mantenla solo para CI/E2E.

## 6. Smoke test despues del deploy

Despues de publicar, valida:

- Puedes iniciar sesion.
- Puedes crear una transaccion de prueba.
- Puedes editar y eliminar esa transaccion.
- Las metas calculan el avance correcto.
- Las alertas se crean y se pueden resolver.
- Recargar en rutas internas no muestra 404.
- En movil, menu, modales y formularios se ven comodos.

## 7. Pendientes antes de lanzamiento publico

- Politica de privacidad.
- Terminos basicos.
- Pagina o mensaje de soporte/contacto.
- Backup o exportacion completa de datos del usuario.
- Revision final responsive en movil real.
