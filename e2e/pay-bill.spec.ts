import { expect, type Page, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

const openBillPayment = async (page: Page) => {
  await page.getByRole("button", { name: "Adicionar pagamento" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo de pagamento").click();
  await page.getByRole("option", { name: "Boleto" }).click();
  return dialog;
};

const selectBill = async (page: Page, name: string) => {
  await page.getByRole("dialog").getByLabel("Boleto").click();
  await page.getByRole("option", { name }).click();
};

test("paga boleto fixo e variável; pagos saem do select", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  const { data: category } = await user.client.from("categories").insert({ name: "Casa" }).select("id").single();
  await user.client.from("bills").insert([
    { name: "Vivo", category_id: category!.id, value_mode: "fixed", amount_cents: 12000 },
    { name: "Enel", category_id: category!.id, value_mode: "variable" },
  ]);
  await page.reload();

  let dialog = await openBillPayment(page);
  await selectBill(page, "Vivo");
  await expect(dialog.getByLabel("Valor pago neste mês")).toBeHidden();
  await expect(dialog.getByText("Total: R$ 120,00")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  dialog = await openBillPayment(page);
  await dialog.getByLabel("Boleto").click();
  await expect(page.getByRole("option", { name: "Vivo" })).toHaveCount(0);
  await page.getByRole("option", { name: "Enel" }).click();
  await expect(dialog.getByText("Total: R$ 0,00")).toBeVisible();
  await dialog.getByLabel("Valor pago neste mês").fill("18745");
  await expect(dialog.getByText("Total: R$ 187,45")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  await openBillPayment(page);
  await expect(page.getByText("Nenhum boleto pendente neste mês.")).toBeVisible();

  const { data: payments } = await user.client.from("payments").select("total_cents").order("total_cents");
  expect(payments).toEqual([{ total_cents: 12000 }, { total_cents: 18745 }]);

  await user.remove();
});
