import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { openPayment } from "./helpers";

test.use({ viewport: { width: 375, height: 812 } });

const pickOption = async (page: Page, label: string, option: string) => {
  await page.getByRole("dialog").getByLabel(label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

test("jornada completa em 375px", async ({ page, signUpEmail }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "jornada roda uma vez, em 375px");
  const dialog = page.getByRole("dialog");
  const nav = page.getByRole("navigation", { name: "Menu inferior" });

  // Cadastro → onboarding
  await page.goto("/cadastro");
  await page.getByLabel("Email").fill(signUpEmail);
  await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
  await page.getByLabel("Confirmar senha").fill("senha-segura");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByLabel("Como podemos te chamar?").fill("Ana");
  await page.getByLabel("Salário líquido mensal").fill("400000");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Olá, Ana" })).toBeVisible();

  // Estado vazio → Recorrências → aviso de tipo → Tipos
  await page.getByRole("link", { name: "Cadastrar recorrências" }).click();
  await page.getByRole("button", { name: "Novo boleto" }).click();
  await dialog.getByRole("link", { name: "Cadastrar tipo" }).click();
  await expect(page).toHaveURL(/\/configuracoes\/tipos$/);
  await page.getByRole("button", { name: "Novo tipo" }).click();
  await dialog.getByLabel("Nome").fill("Internet");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Internet" })).toBeVisible();

  // Bancos
  await nav.getByRole("link", { name: "Configurações" }).click();
  await page.getByRole("link", { name: "Bancos" }).click();
  await page.getByRole("button", { name: "Novo banco" }).click();
  await dialog.getByLabel("Nome").fill("Nubank");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Nubank" })).toBeVisible();

  // Recorrências: boleto fixo + item do cartão
  await nav.getByRole("link", { name: "Recorrências" }).click();
  await page.getByRole("button", { name: "Novo boleto" }).click();
  await dialog.getByLabel("Nome").fill("Vivo");
  await pickOption(page, "Tipo", "Internet");
  await dialog.getByLabel("Valor mensal").fill("12000");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Vivo" })).toContainText("R$ 120,00");

  await page.getByRole("tab", { name: "Cartão" }).click();
  await page.getByRole("button", { name: "Novo item do cartão" }).click();
  await dialog.getByLabel("Nome").fill("Netflix");
  await pickOption(page, "Tipo", "Internet");
  await pickOption(page, "Banco", "Nubank");
  await dialog.getByLabel("Valor mensal").fill("5590");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Netflix" })).toContainText("Recorrente");

  // Salário antes de qualquer pagamento
  await nav.getByRole("link", { name: "Início" }).click();
  const salary = page.getByRole("region", { name: "Salário" });
  const leftover = page.getByRole("region", { name: "Sobra" });
  await salary.getByRole("button", { name: "Atualizar salário" }).click();
  await dialog.getByLabel("Novo salário líquido").fill("450000");
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(salary).toContainText("R$ 4.500,00");

  // Pagar boleto e fatura
  await openPayment(page, "Boleto");
  await pickOption(page, "Boleto", "Vivo");
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  await openPayment(page, "Cartão de crédito");
  await pickOption(page, "Banco", "Nubank");
  await expect(dialog.getByText("Total: R$ 55,90")).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar" }).click();
  await expect(dialog).toBeHidden();

  await expect(leftover).toContainText("R$ 4.324,10");
  await expect(salary.getByRole("button", { name: "Atualizar salário" })).toBeDisabled();

  // Desfazer boleto: sobra volta; salário segue travado (fatura paga)
  await page.getByRole("button", { name: "Desfazer pagamento de Vivo" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Desfazer" }).click();
  await expect(leftover).toContainText("R$ 4.444,10");
  await expect(salary.getByRole("button", { name: "Atualizar salário" })).toBeDisabled();

  // Nenhuma tela com scroll horizontal
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
