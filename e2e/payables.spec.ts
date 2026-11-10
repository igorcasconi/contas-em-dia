import { seedBankWithItems } from "@/supabase/tests/card-fixtures";
import { must } from "@/supabase/tests/helpers";

import { expect, test } from "./fixtures";

test("lista do mês: não pagos primeiro, fatura expansível e desfazer", async ({ page, onboardedUser: user }) => {
  const category = must(await user.client.from("categories").insert({ name: "Casa" }).select("id").single());
  const bills = must(await user.client
    .from("bills")
    .insert([
      { name: "Vivo", category_id: category.id, value_mode: "fixed", amount_cents: 12000 },
      { name: "Enel", category_id: category.id, value_mode: "variable" },
    ])
    .select("id, name"));
  await seedBankWithItems(user, "Nubank", [
    { name: "Netflix", amount_cents: 5590 },
    { name: "Notebook", amount_cents: 40220, remaining_months: 3 },
  ]);
  must(await user.client.rpc("pay_bill", { p_bill_id: bills.find(({ name }) => name === "Vivo")!.id }));
  await page.reload();

  const list = page.getByRole("region", { name: "Pagamentos do mês" }).getByRole("list").first();
  const rows = list.locator(":scope > li");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("Nubank");
  await expect(rows.nth(0)).toContainText("R$ 458,10");
  await expect(rows.nth(0)).toContainText("Não pago");
  await expect(rows.nth(1)).toContainText("Enel");
  await expect(rows.nth(1)).toContainText("Valor variável");
  await expect(rows.nth(2)).toContainText("Vivo");
  await expect(rows.nth(2)).toContainText("Pago");

  await page.getByRole("button", { name: "Itens de Nubank" }).click();
  await expect(rows.nth(0)).toContainText("Netflix");
  await expect(rows.nth(0)).toContainText("3 meses restantes");

  await page.getByRole("button", { name: "Desfazer pagamento de Vivo" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Vivo — R$ 120,00");
  await confirm.getByRole("button", { name: "Desfazer" }).click();
  await expect(confirm).toBeHidden();

  await expect(rows.nth(1)).toContainText("Vivo");
  await expect(rows.nth(1)).toContainText("Não pago");
  await expect(page.getByRole("button", { name: /Desfazer pagamento/ })).toHaveCount(0);
});

test("estado vazio leva às recorrências", async ({ page, onboardedUser: _user }) => {
  await expect(page.getByText("Nenhuma conta cadastrada.")).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar recorrências" }).click();
  await expect(page).toHaveURL(/\/recorrencias$/);
});
