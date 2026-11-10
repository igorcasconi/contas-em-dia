import { seedBankWithItems } from "@/supabase/tests/card-fixtures";
import { must } from "@/supabase/tests/helpers";
import { currentMonth, formatMonth } from "@/shared/utils/month";

import { expect, test } from "./fixtures";
import { openPayment } from "./helpers";

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

test("avulsos entram na fatura da Início, são pagos travados e reabrem ao desfazer", async ({ page, onboardedUser: user }) => {
  const { bankId: nubankId } = await seedBankWithItems(user, "Nubank", [{ name: "Netflix", amount_cents: 5000 }]);
  const category = must(await user.client.from("categories").select("id").single());
  const c6 = must(await user.client.from("banks").insert({ name: "C6" }).select("id").single());
  must(await user.client.from("card_purchases").insert([
    { name: "Farmácia", bank_id: nubankId, category_id: category.id, amount_cents: 3000 },
    { name: "Mercado", bank_id: c6.id, category_id: category.id, amount_cents: 12000 },
  ]).select());
  await page.reload();

  const rows = page.getByRole("region", { name: "Pagamentos do mês" }).getByRole("list").first().locator(":scope > li");
  const row = (name: string) => rows.filter({ hasText: name });
  await expect(row("C6")).toContainText("R$ 120,00");
  await expect(row("C6")).toContainText("Não pago");
  await expect(row("Nubank")).toContainText("R$ 80,00");

  await page.getByRole("button", { name: "Itens de Nubank" }).click();
  const nubankItems = row("Nubank").getByRole("listitem");
  await expect(nubankItems).toHaveCount(2);
  await expect(nubankItems.nth(0)).toContainText("Netflix");
  await expect(nubankItems.nth(0)).not.toContainText("Avulso");
  await expect(nubankItems.nth(1)).toContainText("Farmácia");
  await expect(nubankItems.nth(1)).toContainText("Avulso");

  const dialog = await openPayment(page, "Cartão de crédito");
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();
  const farmacia = dialog.getByRole("listitem").filter({ hasText: "Farmácia" });
  await expect(dialog.getByRole("checkbox", { name: "Farmácia" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Farmácia" })).toBeDisabled();
  await expect(farmacia.getByRole("img", { name: "Avulso" })).toBeVisible();
  await expect(farmacia.getByRole("button")).toHaveCount(0);
  await expect(dialog.getByText("Total: R$ 80,00")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  const leftover = page.getByRole("region", { name: "Sobra" });
  await expect(leftover).toContainText("R$ 4.920,00");
  await expect(row("Nubank")).toContainText("Pago");
  // Fatura segue expandida após o refresh
  await expect(page.getByRole("button", { name: "Itens de Nubank" })).toHaveAttribute("aria-expanded", "true");
  await expect(row("Nubank").getByRole("listitem").filter({ hasText: "Farmácia" })).toContainText("Avulso");

  // Banco só com avulsos: paga com items vazios
  const c6Dialog = await openPayment(page, "Cartão de crédito");
  await c6Dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "C6" }).click();
  await expect(c6Dialog.getByRole("checkbox", { name: "Mercado" })).toBeDisabled();
  await expect(c6Dialog.getByText("Total: R$ 120,00")).toBeVisible();
  await c6Dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(c6Dialog).toBeHidden();
  await expect(leftover).toContainText("R$ 4.800,00");
  await expect(row("C6")).toContainText("Pago");

  await page.getByRole("button", { name: "Desfazer pagamento de Nubank" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Nubank — R$ 80,00");
  await confirm.getByRole("button", { name: "Desfazer" }).click();
  await expect(confirm).toBeHidden();
  await expect(row("Nubank")).toContainText("Não pago");
  await expect(leftover).toContainText("R$ 4.880,00");
});

test("trava avulsos do banco com fatura paga até desfazer o pagamento", async ({ page, onboardedUser: user }) => {
  const { bankId, ids } = await seedBankWithItems(user, "Nubank", [{ name: "Netflix", amount_cents: 5000 }]);
  const category = must(await user.client.from("categories").select("id").single());
  must(await user.client.from("card_purchases").insert({
    name: "Farmácia", bank_id: bankId, category_id: category.id, amount_cents: 3000,
  }).select());
  must(await user.client.rpc("pay_card", { p_bank_id: bankId, p_items: [{ card_item_id: ids.Netflix, included: true }] }));

  await page.goto("/avulsos");
  const nubank = page.getByRole("region", { name: "Nubank" });
  await expect(nubank).toContainText("Fatura paga");
  await expect(nubank.getByRole("listitem").filter({ hasText: "Farmácia" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar Farmácia" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Excluir Farmácia" })).toHaveCount(0);

  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Nova compra avulsa" }).click();
  await dialog.getByLabel("Descrição").fill("Mercado");
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();
  await dialog.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Tipo Nubank" }).click();
  await dialog.getByLabel("Valor").fill("2000");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toContainText("A fatura do Nubank deste mês já foi paga. Desfaça o pagamento na Início para alterar.");
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(nubank.getByRole("listitem")).toHaveCount(1);

  await page.goto("/");
  await page.getByRole("button", { name: "Desfazer pagamento de Nubank" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByRole("alertdialog")).toBeHidden();

  await page.goto("/avulsos");
  await expect(nubank).not.toContainText("Fatura paga");
  await expect(page.getByRole("button", { name: "Editar Farmácia" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Excluir Farmácia" })).toBeVisible();
});
