import { expect, test } from "@playwright/test";

import { seedBankWithItems } from "@/supabase/tests/card-fixtures";

import { loginAsOnboardedUser } from "./helpers";

test("paga fatura com checklist: desmarcar, pausar, remover, reativar e parcela travada", async ({ page }) => {
  const user = await loginAsOnboardedUser(page);
  await seedBankWithItems(user, "Nubank", [
    { name: "Netflix", amount_cents: 5590 },
    { name: "Spotify", amount_cents: 2190 },
    { name: "Disney", amount_cents: 3390, status: "paused" },
    { name: "Notebook", amount_cents: 40220, remaining_months: 3 },
  ]);
  await page.reload();

  await page.getByRole("button", { name: "Adicionar pagamento" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo de pagamento").click();
  await page.getByRole("option", { name: "Cartão de crédito" }).click();
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();

  const total = (value: string) => expect(dialog.getByText(`Total: R$ ${value}`)).toBeVisible();
  const checkbox = (name: string) => dialog.getByRole("checkbox", { name });

  await expect(checkbox("Netflix")).toBeChecked();
  await expect(checkbox("Disney")).not.toBeChecked();
  await expect(dialog.getByRole("listitem").filter({ hasText: "Disney" })).toContainText("Pausado");
  await expect(checkbox("Notebook")).toBeChecked();
  await expect(checkbox("Notebook")).toBeDisabled();
  await total("480,00");

  await checkbox("Spotify").click();
  await total("458,10");

  await dialog.getByRole("button", { name: "Pausar Netflix" }).click();
  await expect(checkbox("Netflix")).not.toBeChecked();
  await expect(dialog.getByRole("listitem").filter({ hasText: "Netflix" })).toContainText("Será pausado");
  await total("402,20");

  await dialog.getByRole("button", { name: "Remover Spotify" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remover" }).click();
  await expect(checkbox("Spotify")).toHaveCount(0);

  await checkbox("Disney").click();
  await total("436,10");

  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  const { data: items } = await user.client.from("card_items").select("name, status, remaining_months, ended_at");
  const byName = Object.fromEntries(items!.map((item) => [item.name, item]));
  expect(byName.Netflix.status).toBe("paused");
  expect(byName.Disney.status).toBe("active");
  expect(byName.Notebook.remaining_months).toBe(2);
  expect(byName.Spotify.ended_at).not.toBeNull();

  const { data: payment } = await user.client.from("payments").select("total_cents").single();
  expect(payment?.total_cents).toBe(43610);

  await user.remove();
});
