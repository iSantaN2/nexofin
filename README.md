# NexoFin

Aplicacion financiera personal construida con React, Vite y Firebase.

## Scripts

- `npm run dev`: desarrollo local.
- `npm run build`: build de produccion.
- `npm run test`: pruebas unitarias (Vitest).
- `npm run e2e`: pruebas E2E (Playwright).
- `npm run e2e:ui`: modo visual de Playwright.

## Pruebas E2E

Las pruebas E2E usan una cuenta real de prueba (Firebase Auth).  
Define estas variables de entorno antes de ejecutar:

- `E2E_AUTH_ENABLED` (`true` para ejecutar flujo login + transacciones)
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_REGISTER_ENABLED` (opcional, `true` para test de registro)
- `E2E_REGISTER_PASSWORD` (opcional, default `NexoFinTest123!`)
- `E2E_REGISTER_DOMAIN` (opcional, default `example.com`)

### Ejemplo PowerShell

```powershell
$env:E2E_EMAIL="tu_correo_prueba@dominio.com"
$env:E2E_PASSWORD="tu_password_prueba"
$env:E2E_AUTH_ENABLED="true"
npm run e2e
```

Para habilitar prueba de registro:

```powershell
$env:E2E_REGISTER_ENABLED="true"
$env:E2E_REGISTER_PASSWORD="NexoFinTest123!"
$env:E2E_REGISTER_DOMAIN="tu-dominio-prueba.com"
npm run e2e
```

Si es tu primera vez con Playwright, instala navegadores:

```powershell
npx playwright install chromium
```

## CI (GitHub Actions)

El proyecto incluye pipeline en:

- `.github/workflows/ci.yml`

Ejecuta automaticamente:

1. `npm ci`
2. `npm run test`
3. `npm run build`
4. `npm run e2e`

Para habilitar E2E con cuenta real en GitHub, agrega estos `Secrets`:

- `E2E_AUTH_ENABLED` (`true` para activar test de login/transacciones)
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_REGISTER_ENABLED` (opcional)
- `E2E_REGISTER_PASSWORD` (opcional)
- `E2E_REGISTER_DOMAIN` (opcional)
