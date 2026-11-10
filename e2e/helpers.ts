import type { Page } from "@playwright/test";

export const login = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
};

/** Abre "Adicionar pagamento" e escolhe o tipo; retorna o diálogo. */
export const openPayment = async (page: Page, kind: "Boleto" | "Cartão de crédito") => {
  await page.getByRole("button", { name: "Adicionar pagamento" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo de pagamento").click();
  await page.getByRole("option", { name: kind, exact: true }).click();
  return dialog;
};
