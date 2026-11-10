import { expect, test } from "./fixtures";

test.describe("cadastro", () => {
  test("cria conta e segue para o onboarding", async ({ page, signUpEmail }) => {
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(signUpEmail);
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
    await page.getByLabel("Confirmar senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/onboarding$/);

    // Logado em /login → proxy manda para / → guarda manda de volta ao onboarding pendente
    await page.goto("/login");
    await expect(page).toHaveURL(/\/onboarding$/);
  });

  test("mostra erro para email já cadastrado", async ({ page, testUser: user }) => {
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
    await page.getByLabel("Confirmar senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Email já cadastrado" })).toBeVisible();
  });
});

test.describe("login", () => {
  test("mostra erro genérico para senha incorreta", async ({ page, testUser: user }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Email ou senha inválidos" })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(user.email);
  });
});

test.describe("rotas protegidas", () => {
  test("redireciona anônimo para o login", async ({ page }) => {
    await page.goto("/recorrencias");
    await expect(page).toHaveURL(/\/login$/);
  });
});
