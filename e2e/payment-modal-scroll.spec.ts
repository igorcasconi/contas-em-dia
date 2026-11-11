import { seedBankWithItems } from "@/supabase/tests/card-fixtures";

import { expect, test } from "./fixtures";
import { openPayment } from "./helpers";

const VIEWPORT = { width: 412, height: 700 };

test("fatura longa: só a lista de itens rola e o modal cabe na tela", async ({ page, onboardedUser: user }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "altura de celular");

  const items = Array.from({ length: 25 }, (_, index) => ({
    name: `Item ${String(index + 1).padStart(2, "0")}`,
    amount_cents: 1000,
  }));
  await seedBankWithItems(user, "Nubank", items);
  await page.setViewportSize(VIEWPORT);
  await page.reload();

  const dialog = await openPayment(page, "Cartão de crédito");
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();

  // Modal limitado a 100dvh - 60px e inteiro dentro da tela
  const box = (await dialog.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(VIEWPORT.height - 60);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height);

  // Só a lista rola
  const invoiceItems = dialog.getByRole("group", { name: "Itens da fatura" });
  const list = invoiceItems.getByRole("list");
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expect(invoiceItems.getByText("Itens da fatura")).toBeInViewport();

  await expect(dialog.getByRole("heading", { name: "Adicionar pagamento" })).toBeInViewport();
  await expect(dialog.getByText("Total: R$ 250,00")).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Confirmar" })).toBeInViewport();

  await list.getByRole("checkbox", { name: "Item 25" }).scrollIntoViewIfNeeded();
  await expect(list.getByRole("checkbox", { name: "Item 25" })).toBeInViewport();
  await expect(invoiceItems.getByText("Itens da fatura")).toBeInViewport();

  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("region", { name: "Sobra" })).toContainText("R$ 4.750,00");
});
