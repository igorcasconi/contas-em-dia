import { expect, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

test("cadastra itens recorrente e parcelado no cartão, agrupa por banco e remove", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  await user.client.from("categories").insert({ name: "Streaming" });

  await page.goto("/recorrencias?aba=cartao");
  await expect(page.getByRole("tab", { name: "Cartão" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Novo item do cartão" }).click();
  await expect(page.getByText("Cadastre um banco antes de criar itens do cartão.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await user.client.from("banks").insert({ name: "Nubank" });
  await page.reload();

  const dialog = page.getByRole("dialog");
  const fillBase = async (name: string, amountDigits: string) => {
    await page.getByRole("button", { name: "Novo item do cartão" }).click();
    await dialog.getByLabel("Nome").fill(name);
    await dialog.getByLabel("Tipo").click();
    await page.getByRole("option", { name: "Streaming" }).click();
    await dialog.getByLabel("Banco").click();
    await page.getByRole("option", { name: "Nubank" }).click();
    await dialog.getByLabel("Valor mensal").fill(amountDigits);
  };

  await fillBase("Netflix", "5590");
  await expect(dialog.getByLabel("Sempre recorrente")).toBeChecked();
  await expect(dialog.getByLabel("Meses restantes")).toBeHidden();
  await dialog.getByRole("button", { name: "Salvar" }).click();

  const nubank = page.getByRole("region", { name: "Nubank" });
  const netflix = nubank.getByRole("listitem").filter({ hasText: "Netflix" });
  await expect(netflix).toContainText("Recorrente");
  await expect(netflix).toContainText("R$ 55,90");

  await fillBase("Notebook", "40220");
  await dialog.getByLabel("Sempre recorrente").click();
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog.getByText("Informe os meses restantes (mínimo 1)")).toBeVisible();
  await dialog.getByLabel("Meses restantes").fill("3");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(nubank.getByRole("listitem").filter({ hasText: "Notebook" })).toContainText("3 meses restantes");

  await page.getByRole("button", { name: "Remover Netflix" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remover" }).click();
  await expect(netflix).toBeHidden();

  await page.getByRole("tab", { name: "Boletos" }).click();
  await expect(page).toHaveURL(/\/recorrencias$/);

  await user.remove();
});
