import { expect, type Page, test } from "@playwright/test";

import { loginAsOnboardedUser } from "./helpers";

const seedBills = async (user: Awaited<ReturnType<typeof loginAsOnboardedUser>>) => {
  const { data: category } = await user.client.from("categories").insert({ name: "Casa" }).select("id").single();
  const { data: bills } = await user.client
    .from("bills")
    .insert([
      { name: "Vivo", category_id: category!.id, value_mode: "fixed", amount_cents: 12000 },
      { name: "Enel", category_id: category!.id, value_mode: "variable" },
    ])
    .select("id, name");
  return Object.fromEntries(bills!.map(({ name, id }) => [name, id]));
};

const openBill = async (page: Page, name: string) => {
  await page.getByRole("button", { name: "Adicionar pagamento" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo de pagamento").click();
  await page.getByRole("option", { name: "Boleto" }).click();
  await dialog.getByLabel("Boleto").click();
  await page.getByRole("option", { name }).click();
  return dialog;
};

test("falha de rede mantém o modal aberto com os dados", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  await seedBills(user);
  await page.reload();

  const dialog = await openBill(page, "Enel");
  await dialog.getByLabel("Valor pago neste mês").fill("18745");

  // Server Actions são POST com header Next-Action
  const abortActions = (route: Parameters<Parameters<Page["route"]>[1]>[0]) =>
    route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.continue();
  await page.route("**/*", abortActions);
  await dialog.getByRole("button", { name: "Confirmar" }).click();

  await expect(dialog.getByRole("alert")).toHaveText(/Verifique sua conexão/);
  await expect(dialog.getByLabel("Valor pago neste mês")).toHaveValue(/187,45/);

  await page.unroute("**/*", abortActions);
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  await user.remove();
});

test("pagamento já registrado em outra aba mostra erro e atualiza o select", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  const ids = await seedBills(user);
  await page.reload();

  const dialog = await openBill(page, "Vivo");
  await user.client.rpc("pay_bill", { p_bill_id: ids.Vivo });
  await dialog.getByRole("button", { name: "Confirmar" }).click();

  await expect(dialog.getByRole("alert")).toHaveText("Este pagamento já foi registrado.");
  await dialog.getByLabel("Boleto").click();
  await expect(page.getByRole("option", { name: "Vivo" })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "Enel" })).toBeVisible();

  await user.remove();
});
