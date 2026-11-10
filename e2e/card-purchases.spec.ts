import { must } from "@/supabase/tests/helpers";
import { currentMonth, formatMonth } from "@/shared/utils/month";

import { expect, test } from "./fixtures";

test("cadastra, edita e exclui compras avulsas do mês agrupadas por banco", async ({ page, onboardedUser: user }) => {
  must(await user.client.from("categories").insert({ name: "Saúde" }).select());

  await page.goto("/avulsos");
  await expect(page.getByRole("heading", { name: "Avulsos" })).toBeVisible();
  await expect(page.getByText(formatMonth(currentMonth()))).toBeVisible();
  await expect(page.getByText("Nenhuma compra avulsa neste mês.")).toBeVisible();

  await page.getByRole("button", { name: "Nova compra avulsa" }).click();
  await expect(page.getByText("Cadastre um banco antes de criar compras avulsas.")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  must(await user.client.from("banks").insert({ name: "Nubank" }).select());
  await page.reload();

  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Nova compra avulsa" }).click();
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog.getByText("Informe a descrição")).toBeVisible();

  await dialog.getByLabel("Descrição").fill("Farmácia");
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();
  await dialog.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Saúde" }).click();
  await dialog.getByLabel("Valor").fill("4590");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();

  const nubank = page.getByRole("region", { name: "Nubank" });
  const farmacia = nubank.getByRole("listitem").filter({ hasText: "Farmácia" });
  await expect(farmacia).toContainText("Saúde");
  await expect(farmacia).toContainText("R$ 45,90");
  await expect(nubank).toContainText("Subtotal R$ 45,90");

  await page.getByRole("button", { name: "Editar Farmácia" }).click();
  await dialog.getByLabel("Valor").fill("8000");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(farmacia).toContainText("R$ 80,00");
  await expect(nubank).toContainText("Subtotal R$ 80,00");

  await page.getByRole("button", { name: "Excluir Farmácia" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Nenhuma compra avulsa neste mês.")).toBeVisible();
});
