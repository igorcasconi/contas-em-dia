import { expect, test } from "./fixtures";

test("cria, valida duplicado e edita bancos", async ({ page, onboardedUser: _user }) => {
  await page.goto("/configuracoes");
  await page.getByRole("link", { name: "Bancos" }).click();
  await expect(page.getByText("Nenhum banco cadastrado.")).toBeVisible();

  await page.getByRole("button", { name: "Novo banco" }).click();
  await page.getByLabel("Nome").fill("Nubank");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Nubank" })).toBeVisible();

  await page.getByRole("button", { name: "Novo banco" }).click();
  await page.getByLabel("Nome").fill("NUBANK");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("dialog").getByText("Já existe um registro com esse nome.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.getByRole("button", { name: "Editar Nubank" }).click();
  await page.getByLabel("Nome").fill("Itaú");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Itaú" })).toBeVisible();
});
