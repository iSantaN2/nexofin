import { expect, test } from "@playwright/test";

const E2E_REGISTER_ENABLED = process.env.E2E_REGISTER_ENABLED === "true";
const E2E_REGISTER_PASSWORD = process.env.E2E_REGISTER_PASSWORD || "NexoFinTest123!";
const E2E_REGISTER_DOMAIN = process.env.E2E_REGISTER_DOMAIN || "example.com";

test.skip(
  !E2E_REGISTER_ENABLED,
  "Activa E2E_REGISTER_ENABLED=true para ejecutar registro automatizado."
);

test("registro redirige a verificacion de correo", async ({ page }) => {
  const uniqueEmail = `nexofin.e2e.${Date.now()}@${E2E_REGISTER_DOMAIN}`;

  await page.goto("/register");
  await page.getByPlaceholder("Correo").fill(uniqueEmail);
  await page.getByPlaceholder("Contrasena").fill(E2E_REGISTER_PASSWORD);
  await page.getByPlaceholder("Confirmar contrasena").fill(E2E_REGISTER_PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(page.getByRole("heading", { name: "Verifica tu correo" })).toBeVisible();
  await expect(page.getByText(uniqueEmail)).toBeVisible();
});
