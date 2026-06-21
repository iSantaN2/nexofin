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
  await page.getByPlaceholder(/contras/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(
    (url) =>
      !url.pathname.endsWith("/login") &&
      ["/", "/onboarding", "/verify-email"].some(
        (pathname) => url.pathname === pathname || url.pathname.endsWith(pathname)
      ),
    { timeout: 10000 }
  );

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
    await page.getByPlaceholder(/como quieres/i).fill("QA E2E");
    await page.getByRole("button", { name: "Guardar y continuar" }).click();
    await expect(page).toHaveURL(/\/$/);
  }
}

test("login + crear + editar + eliminar transaccion", async ({ page }) => {
  const uniqueTag = `E2E-${Date.now()}`;

  await login(page);
  await handlePostLoginRedirects(page);
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("open-transaction-modal").click();
  const addTransactionDialog = page.getByRole("dialog", { name: /anadir transaccion/i });

  await addTransactionDialog.locator("select").first().selectOption({ index: 1 });

  await addTransactionDialog.getByLabel("Monto").fill("123.45");
  await addTransactionDialog.getByLabel("Notas").fill(uniqueTag);
  await addTransactionDialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(/transaccion anadida correctamente/i)).toBeVisible();
  await expect(addTransactionDialog).toHaveCount(0);
  await expect(page.getByTestId("open-transaction-modal")).toBeVisible();

  await page.getByRole("link", { name: "Transacciones" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.locator('input[type="text"]').first().fill(uniqueTag);
  await expect(page.getByText("Movimientos: 1")).toBeVisible();

  const firstCard = page.locator("li").first();
  await firstCard.getByTitle(/editar transac/i).click();
  await page.getByPlaceholder("Monto", { exact: true }).fill("234.56");
  await page.getByRole("button", { name: /guardar cambios/i }).click();
  await expect(page.getByText(/actualizada correctamente/i)).toBeVisible();
  await expect(firstCard.getByText("- S/ 234.56")).toBeVisible();

  await firstCard.getByTitle(/eliminar transac/i).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText(/eliminada correctamente/i)).toBeVisible();
  await expect(page.getByText(/no encontramos movimientos/i)).toBeVisible();
});

test("login + crear + eliminar meta con categoria temporal", async ({ page }) => {
  const uniqueTag = Date.now();
  const categoryName = `E2E Meta ${uniqueTag}`;

  await login(page);
  await handlePostLoginRedirects(page);
  await expect(page).toHaveURL(/\/$/);

  await page.getByTestId("open-transaction-modal").click();
  const addTransactionDialog = page.getByRole("dialog", { name: /anadir transaccion/i });
  await addTransactionDialog.getByTitle(/nueva categor/i).click();
  await page.getByLabel(/nombre de categoria/i).fill(categoryName);
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(
    page
      .getByText(new RegExp(`categoria\\s+"${categoryName}"\\s+anadida correctamente`, "i"))
      .first()
  ).toBeVisible();
  await page.getByLabel(/cerrar modal/i).click();

  await page.getByRole("link", { name: "Metas", exact: true }).click();
  await expect(page).toHaveURL(/\/budgets$/);
  await page.getByTestId("budget-category-select").selectOption({ label: categoryName });
  await page.getByTestId("budget-amount-input").fill("999");
  await page.getByTestId("save-budget-button").click();
  await expect(page.getByText(/meta guardada correctamente/i)).toBeVisible();

  const budgetCard = page.getByTestId("budget-card").filter({ hasText: categoryName });
  await expect(budgetCard).toBeVisible();
  await budgetCard.getByTitle(/eliminar meta/i).click();
  await expect(page.getByText(/meta eliminada/i)).toBeVisible();
  await expect(budgetCard).toHaveCount(0);

  await page.getByRole("link", { name: "Ajustes" }).click();
  await page.getByRole("button", { name: /categor/i }).click();
  const categoryRow = page.getByTestId("category-row").filter({ hasText: categoryName });
  await expect(categoryRow).toBeVisible();
  await categoryRow.getByTitle(/eliminar/i).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(categoryRow).toHaveCount(0);
});
