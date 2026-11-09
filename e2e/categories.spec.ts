import { expect, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

test("cria, valida duplicado, edita e exclui tipos", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  await page.goto("/configuracoes/tipos");
  await expect(page.getByText("Nenhum tipo cadastrado.")).toBeVisible();

  await page.getByRole("button", { name: "Novo tipo" }).click();
  await page.getByLabel("Nome").fill("Internet");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Internet" })).toBeVisible();

  await page.getByRole("button", { name: "Novo tipo" }).click();
  await page.getByLabel("Nome").fill("internet");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("dialog").getByText("Já existe um registro com esse nome.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.getByRole("button", { name: "Editar Internet" }).click();
  await page.getByLabel("Nome").fill("Internet Fibra");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Internet Fibra" })).toBeVisible();

  await page.getByRole("button", { name: "Excluir Internet Fibra" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Nenhum tipo cadastrado.")).toBeVisible();

  await user.remove();
});
