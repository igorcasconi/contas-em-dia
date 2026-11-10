import { expect, test } from "./fixtures";

test("cadastro → onboarding → início; onboarding não é exibido de novo", async ({ page, signUpEmail }) => {
  await page.goto("/cadastro");
  await page.getByLabel("Email").fill(signUpEmail);
  await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
  await page.getByLabel("Confirmar senha").fill("senha-segura");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Salário líquido mensal").fill("0");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page.getByText("Informe seu nome")).toBeVisible();
  await expect(page.getByText("Informe um valor maior que zero")).toBeVisible();

  await page.getByLabel("Como podemos te chamar?").fill("Igor");
  await page.getByLabel("Salário líquido mensal").fill("5.000,00");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/$/);
});
