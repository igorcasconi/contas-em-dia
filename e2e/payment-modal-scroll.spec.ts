import type { Locator, Page } from "@playwright/test";

import { seedBankWithItems } from "@/supabase/tests/card-fixtures";
import type { TestUser } from "@/supabase/tests/helpers";

import { expect, test } from "./fixtures";
import { openPayment } from "./helpers";

const VIEWPORT = { width: 412, height: 700 };

const openInvoice = async (page: Page, user: TestUser, count: number) => {
  const items = Array.from({ length: count }, (_, index) => ({
    name: `Item ${String(index + 1).padStart(2, "0")}`,
    amount_cents: 1000,
  }));
  await seedBankWithItems(user, "Nubank", items);
  await page.setViewportSize(VIEWPORT);
  await page.reload();

  const dialog = await openPayment(page, "Cartão de crédito");
  await dialog.getByLabel("Banco").click();
  await page.getByRole("option", { name: "Nubank" }).click();

  const invoiceItems = dialog.getByRole("group", { name: "Itens da fatura" });
  const list = invoiceItems.getByRole("list");
  // Medir só com a lista inteira renderizada
  await expect(list.getByRole("checkbox")).toHaveCount(count);
  return { dialog, invoiceItems, list };
};

const dialogBox = async (dialog: Locator) => {
  const box = await dialog.boundingBox();
  if (!box) throw new Error("modal não está visível para medir");
  return box;
};

const isScrollable = (locator: Locator) => locator.evaluate((element) => element.scrollHeight > element.clientHeight);

/** Tudo fora da lista de itens fica visível e o modal em si não rola. */
const expectFixedPartsInViewport = async (dialog: Locator, invoiceItems: Locator, total: string) => {
  await expect(dialog.getByRole("heading", { name: "Adicionar pagamento" })).toBeInViewport();
  await expect(dialog.getByLabel("Tipo de pagamento")).toBeInViewport();
  await expect(dialog.getByLabel("Banco")).toBeInViewport();
  await expect(invoiceItems.getByText("Itens da fatura")).toBeInViewport();
  await expect(dialog.getByText(`Total: ${total}`)).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Confirmar" })).toBeInViewport();
  expect(await isScrollable(dialog)).toBe(false);
};

test("fatura longa: só a lista de itens rola e o modal cabe na tela", async ({ page, onboardedUser: user }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "altura de celular");

  const { dialog, invoiceItems, list } = await openInvoice(page, user, 25);

  // Modal limitado a 100dvh - 60px e inteiro dentro da tela
  const box = await dialogBox(dialog);
  expect(box.height).toBeLessThanOrEqual(VIEWPORT.height - 60);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height);

  expect(await isScrollable(list)).toBe(true);
  await expectFixedPartsInViewport(dialog, invoiceItems, "R$ 250,00");

  await list.getByRole("checkbox", { name: "Item 25" }).scrollIntoViewIfNeeded();
  await expect(list.getByRole("checkbox", { name: "Item 25" })).toBeInViewport();
  await expectFixedPartsInViewport(dialog, invoiceItems, "R$ 250,00");

  // Erro no rodapé continua visível junto do botão
  const abortActions = (route: Parameters<Parameters<Page["route"]>[1]>[0]) =>
    route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.continue();
  await page.route("**/*", abortActions);
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog.getByRole("alert")).toBeInViewport();
  await expectFixedPartsInViewport(dialog, invoiceItems, "R$ 250,00");

  await page.unroute("**/*", abortActions);
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("region", { name: "Sobra" })).toContainText("R$ 4.750,00");
});

test("fatura curta: modal na altura do conteúdo, sem rolagem", async ({ page, onboardedUser: user }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "altura de celular");

  const { dialog, invoiceItems, list } = await openInvoice(page, user, 3);

  const box = await dialogBox(dialog);
  expect(box.height).toBeLessThan(VIEWPORT.height - 60);
  expect(await isScrollable(list)).toBe(false);
  await expectFixedPartsInViewport(dialog, invoiceItems, "R$ 30,00");
});
