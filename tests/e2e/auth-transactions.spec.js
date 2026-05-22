import { expect, test } from "@playwright/test";

const E2E_EMAIL = process.env.E2E_EMAIL;
const E2E_PASSWORD = process.env.E2E_PASSWORD;
const E2E_AUTH_ENABLED = process.env.E2E_AUTH_ENABLED === "true";

test.skip(
  !E2E_AUTH_ENABLED || !E2E_EMAIL || !E2E_PASSWORD,
  "Define E2E_AUTH_ENABLED=true y credenciales E2E_EMAIL/E2E_PASSWORD para ejecutar este flujo."
);

async function login(page) {
  await page.goto("/login");
  await page.getByPlaceholder("Correo").fill(E2E_EMAIL);
  await page.getByPlaceholder("Contrasena").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForTimeout(1000);

  if (page.url().includes("/login")) {
    throw new Error(
      "Login E2E fallido: revisa E2E_EMAIL/E2E_PASSWORD o verifica que el usuario exista y este verificado."
    );
  }
}

async function handlePostLoginRedirects(page) {
  if (page.url().includes("/verify-email")) {
    throw new Error(
      "La cuenta E2E no esta verificada. Verificala para poder correr pruebas automatizadas."
    );
  }

  if (page.url().includes("/onboarding")) {
    await page.getByPlaceholder("Como quieres que te llamemos").fill("QA E2E");
    await page.getByRole("button", { name: "Guardar y continuar" }).click();
  }
}

test("login + crear + editar + eliminar transaccion", async ({ page }) => {
  const uniqueTag = `E2E-${Date.now()}`;

  await login(page);
  await handlePostLoginRedirects(page);

  await expect(page).toHaveURL(/\/$/);

  await page.locator("button.fixed.bottom-6.right-6").click();

  const categorySelect = page.locator('select').first();
  await categorySelect.selectOption({ index: 1 });

  await page.getByPlaceholder("Monto").fill("123.45");
  await page.getByPlaceholder("Notas (opcional)").fill(uniqueTag);
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Transaccion anadida correctamente")).toBeVisible();

  await page.getByRole("link", { name: "Transacciones" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.getByPlaceholder("Categoria, metodo, nota o monto").fill(uniqueTag);
  await expect(page.getByText("Movimientos: 1")).toBeVisible();

  const firstCard = page.locator("li").first();
  await firstCard.getByTitle("Editar transaccion").click();
  await page.getByPlaceholder("Monto").fill("234.56");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Transaccion actualizada correctamente")).toBeVisible();
  await expect(firstCard.getByText("- S/ 234.56")).toBeVisible();

  await firstCard.getByTitle("Eliminar transaccion").click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Transaccion eliminada correctamente")).toBeVisible();
  await expect(page.getByText("No hay transacciones para mostrar.")).toBeVisible();
});
