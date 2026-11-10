import { expect, test } from "./fixtures";

const HEADLINE = "Quanto sobra do seu salário este mês?";

test.describe("landing", () => {
  test("mostra a landing para anônimo em /", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: HEADLINE })).toBeVisible();
    for (const title of ["Boletos fixos e variáveis", "Cartões por banco", "Painel do mês"]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("leva ao cadastro e ao login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Começar agora" }).click();
    await expect(page).toHaveURL(/\/cadastro$/);

    await page.getByRole("link", { name: "Contas em Dia" }).click();
    await expect(page.getByRole("heading", { name: HEADLINE })).toBeVisible();

    await page.getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logado vê o dashboard em / e sai da rota da landing", async ({ page, onboardedUser: _user }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Olá, Igor" })).toBeVisible();

    await page.goto("/inicio");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Olá, Igor" })).toBeVisible();
  });
});
