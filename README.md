# NexoFin

NexoFin es una app financiera personal construida con React, Vite y Firebase. Su objetivo es ayudar a registrar movimientos, entender el mes actual, controlar metas de gasto y recibir alertas financieras utiles.

## Funcionalidades principales

- Dashboard mensual con balance, ingresos, gastos, metas e insights.
- Gestion de transacciones con filtros, edicion, eliminacion y resumen.
- Calendario financiero mensual/semanal con detalle por dia.
- Reportes con graficos, comparativas y exportacion.
- Metas de gasto por categoria con estados saludable, atencion y critico.
- Centro de alertas con recomendaciones, prioridad, filtros y acciones.
- Ajustes de perfil, categorias, metodos de pago y notificaciones.
- Autenticacion con Firebase Auth y datos separados por usuario.

## Stack

- React 19
- Vite
- Firebase Auth
- Cloud Firestore
- Vitest
- Playwright
- GitHub Actions

## Instalacion local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Luego abre la URL local que muestre Vite, normalmente:

```text
http://localhost:5173
```

## Variables de entorno

Copia `.env.example` como `.env` y completa la configuracion web de Firebase.

Importante: no subas `.env` al repositorio. Ya esta protegido en `.gitignore`.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Levanta la app localmente. |
| `npm run build` | Genera build de produccion en `dist`. |
| `npm run preview` | Previsualiza el build local. |
| `npm run lint` | Revisa calidad de codigo con ESLint. |
| `npm run test` | Ejecuta pruebas unitarias con Vitest. |
| `npm run test:watch` | Ejecuta Vitest en modo observacion. |
| `npm run e2e` | Ejecuta pruebas E2E con Playwright. |
| `npm run e2e:ui` | Abre Playwright en modo visual. |
| `npm run quality` | Ejecuta lint, tests unitarios y build. |

## Firebase requerido

Antes de usar la app en produccion, revisa:

- Firebase Authentication con proveedor Email/Password activado.
- Cloud Firestore creado.
- Reglas publicadas desde `firestore.rules`.
- Dominios autorizados en Authentication para local y produccion.
- Variables `VITE_FIREBASE_*` configuradas en el hosting.

## Pruebas E2E

Las pruebas E2E pueden usar una cuenta real de prueba en Firebase Auth.

Recomendacion importante: usa una cuenta exclusiva de testing, no tu cuenta principal.

Variables disponibles:

- `E2E_AUTH_ENABLED`: `true` para ejecutar login y flujo de transacciones.
- `E2E_EMAIL`: correo de la cuenta de prueba.
- `E2E_PASSWORD`: password de la cuenta de prueba.
- `E2E_REGISTER_ENABLED`: `true` si quieres probar registro automatico.
- `E2E_REGISTER_PASSWORD`: password para el test de registro.
- `E2E_REGISTER_DOMAIN`: dominio usado para generar correos de registro.

Ejemplo local en PowerShell:

```powershell
$env:E2E_AUTH_ENABLED="true"
$env:E2E_EMAIL="correo-test@dominio.com"
$env:E2E_PASSWORD="password-de-test"
npm run e2e
```

Si es la primera vez con Playwright:

```powershell
npx playwright install chromium
```

## CI con GitHub Actions

El workflow esta en `.github/workflows/ci.yml` y ejecuta:

1. Instalar dependencias.
2. Ejecutar lint.
3. Ejecutar pruebas unitarias.
4. Generar build.
5. Instalar Chromium para Playwright.
6. Ejecutar pruebas E2E.

Para activar login real en CI, crea estos secrets en GitHub:

- `E2E_AUTH_ENABLED=true`
- `E2E_EMAIL`
- `E2E_PASSWORD`

Opcionales:

- `E2E_REGISTER_ENABLED`
- `E2E_REGISTER_PASSWORD`
- `E2E_REGISTER_DOMAIN`

## Deploy rapido

### Vercel

1. Importa el repo en Vercel.
2. Framework: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Agrega las variables `VITE_FIREBASE_*`.
6. Deploy.

`vercel.json` ya incluye rewrite para que rutas como `/settings`, `/reports` o `/notifications` funcionen al recargar.

### Firebase Hosting

1. Instala Firebase CLI si no lo tienes.
2. Ejecuta `npm run build`.
3. Ejecuta `firebase deploy --only hosting,firestore:rules`.

`firebase.json` ya apunta a `dist` y a `firestore.rules`.

## Checklist antes de produccion

- `npm run quality` pasa localmente.
- `npm run e2e` pasa con cuenta de prueba.
- GitHub Actions queda en verde.
- Firestore rules publicadas.
- Dominios autorizados configurados.
- `.env` no esta versionado.
- Cuenta E2E dedicada creada y verificada.
- Politica de privacidad y terminos listos antes de uso publico.
