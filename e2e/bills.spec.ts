import { must } from "@/supabase/tests/helpers";

import { expect, test } from "./fixtures";

test("cadastra boletos fixo e variável, edita e remove", async ({ page, onboardedUser: user }) => {
  await page.goto("/recorrencias");
  await page.getByRole("button", { name: "Novo boleto" }).click();
  await expect(page.getByText("Cadastre um tipo antes de criar boletos.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar" })).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar" }).click();

  must(await user.client.from("categories").insert([{ name: "Internet" }, { name: "Energia" }]).select());
  await page.reload();
  await expect(page.getByText("Nenhum boleto cadastrado.")).toBeVisible();

  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Novo boleto" }).click();
  await dialog.getByLabel("Nome").fill("Vivo Fibra");
  await dialog.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Internet" }).click();
  await dialog.getByLabel("Valor mensal").fill("12000");
  await dialog.getByRole("button", { name: "Salvar" }).click();

  const internet = page.getByRole("listitem").filter({ hasText: "Vivo Fibra" });
  await expect(internet).toContainText("Fixo");
  await expect(internet).toContainText("R$ 120,00");

  await page.getByRole("button", { name: "Novo boleto" }).click();
  await dialog.getByLabel("Nome").fill("Enel");
  await dialog.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Energia" }).click();
  await dialog.getByLabel("Variável").click();
  await expect(dialog.getByLabel("Valor mensal")).toBeHidden();
  await dialog.getByRole("button", { name: "Salvar" }).click();

  const energy = page.getByRole("listitem").filter({ hasText: "Enel" });
  await expect(energy).toContainText("Variável");
  await expect(energy).toContainText("Valor variável");

  await page.getByRole("button", { name: "Editar Vivo Fibra" }).click();
  await dialog.getByLabel("Valor mensal").fill("15000");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(internet).toContainText("R$ 150,00");

  await page.getByRole("button", { name: "Remover Enel" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remover" }).click();
  await expect(energy).toBeHidden();
});
