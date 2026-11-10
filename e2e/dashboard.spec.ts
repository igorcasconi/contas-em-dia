import { currentMonth, formatMonthShort } from "@/shared/utils/month";
import { seedBankWithItems } from "@/supabase/tests/card-fixtures";
import { must } from "@/supabase/tests/helpers";

import { expect, test } from "./fixtures";

test("sobra e gráficos refletem os pagamentos do mês", async ({ page, onboardedUser: user }) => {
  await expect(page.getByRole("region", { name: "Sobra" })).toContainText("R$ 5.000,00");
  await expect(page.getByText("Nenhum pagamento de cartão neste mês.")).toBeVisible();

  const category = must(await user.client.from("categories").insert({ name: "Casa" }).select("id").single());
  const bill = must(await user.client
    .from("bills")
    .insert({ name: "Vivo", category_id: category.id, value_mode: "fixed", amount_cents: 10000 })
    .select("id")
    .single());
  const { bankId, ids } = await seedBankWithItems(user, "Nubank", [{ name: "Netflix", amount_cents: 20000 }]);
  must(await user.client.rpc("pay_bill", { p_bill_id: bill.id }));
  must(await user.client.rpc("pay_card", { p_bank_id: bankId, p_items: [{ card_item_id: ids.Netflix, included: true }] }));
  await page.reload();

  await expect(page.getByRole("region", { name: "Sobra" })).toContainText("R$ 4.700,00");

  const yearChart = page.getByRole("region", { name: /Gastos em \d{4}/ });
  await expect(yearChart.getByRole("img", { name: /Total pago por mês/ })).toBeVisible();
  await expect(yearChart).toContainText(`${formatMonthShort(currentMonth())}: R$ 300,00`);

  const bankChart = page.getByRole("region", { name: "Cartões neste mês" });
  await expect(bankChart.getByRole("img", { name: "Total pago por cartão neste mês" })).toBeVisible();
  await expect(bankChart).toContainText("Nubank: R$ 200,00");
});

test("sobra negativa quando pagamentos passam do salário", async ({ page, onboardedUser: user }) => {
  const category = must(await user.client.from("categories").insert({ name: "Casa" }).select("id").single());
  const bill = must(await user.client
    .from("bills")
    .insert({ name: "Aluguel", category_id: category.id, value_mode: "fixed", amount_cents: 600000 })
    .select("id")
    .single());
  must(await user.client.rpc("pay_bill", { p_bill_id: bill.id }));
  await page.reload();

  const leftover = page.getByRole("region", { name: "Sobra" });
  await expect(leftover).toContainText("-R$ 1.000,00");
  await expect(leftover).toContainText("Pagamentos acima do salário do mês.");
});
