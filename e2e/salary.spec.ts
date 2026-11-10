import { expect, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

test("atualiza salário com confirmação e trava enquanto houver pagamento no mês", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  const salary = page.getByRole("region", { name: "Salário" });
  const editButton = salary.getByRole("button", { name: "Atualizar salário" });
  const dialog = page.getByRole("dialog");
  await expect(salary).toContainText("R$ 5.000,00");

  await editButton.click();
  await dialog.getByLabel("Novo salário líquido").fill("550000");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await expect(dialog).toContainText("passará de R$ 5.000,00 para R$ 5.500,00");
  await dialog.getByRole("button", { name: "Voltar" }).click();
  await expect(dialog.getByLabel("Novo salário líquido")).toHaveValue(/R\$\s5\.500,00/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(salary).toContainText("R$ 5.000,00");

  await editButton.click();
  await dialog.getByLabel("Novo salário líquido").fill("550000");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();
  await expect(salary).toContainText("R$ 5.500,00");

  const { data: category } = await user.client.from("categories").insert({ name: "Casa" }).select("id").single();
  const { data: bill } = await user.client
    .from("bills")
    .insert({ name: "Vivo", category_id: category!.id, value_mode: "fixed", amount_cents: 12000 })
    .select("id")
    .single();
  await user.client.rpc("pay_bill", { p_bill_id: bill!.id });
  await page.reload();
  await expect(editButton).toBeDisabled();
  await expect(salary).toContainText("Desfaça os pagamentos do mês para alterar o salário.");

  await page.getByRole("button", { name: "Desfazer pagamento de Vivo" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Desfazer" }).click();
  await expect(editButton).toBeEnabled();

  await user.remove();
});
