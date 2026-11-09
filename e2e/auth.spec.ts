import { expect, test } from "@playwright/test";

import { createTestUser } from "@/supabase/tests/helpers";

const uniqueEmail = () => `e2e-${crypto.randomUUID()}@example.com`;

test.describe("cadastro", () => {
  test("cria conta e segue para o onboarding", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
    await page.getByLabel("Confirmar senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/onboarding$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
  });

  test("mostra erro para email já cadastrado", async ({ page }) => {
    const user = await createTestUser();

    await page.goto("/cadastro");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura");
    await page.getByLabel("Confirmar senha").fill("senha-segura");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Email já cadastrado" })).toBeVisible();
    await user.remove();
  });
});

test.describe("login", () => {
  test("mostra erro genérico para senha incorreta", async ({ page }) => {
    const user = await createTestUser();

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Email ou senha inválidos" })).toBeVisible();
    await user.remove();
  });
});

test.describe("rotas protegidas", () => {
  test("redireciona anônimo para o login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
