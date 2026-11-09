import { expect, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

test("altera o nome e sai da conta", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);

  await page.goto("/configuracoes/perfil");
  await page.getByLabel("Nome").fill("Bea");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("status")).toHaveText("Nome atualizado.");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Olá, Bea" })).toBeVisible();

  await page.goto("/configuracoes/perfil");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await user.remove();
});
