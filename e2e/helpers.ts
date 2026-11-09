import { expect, type Page } from "@playwright/test";

import { createTestUser } from "@/supabase/tests/helpers";

export const login = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
};

/** Usuário com onboarding concluído (nome "Igor", salário R$ 5.000,00), já logado na Início. */
export const loginAsOnboardedUser = async (page: Page) => {
  const user = await createTestUser();
  const { error } = await user.client.rpc("complete_onboarding", { p_name: "Igor", p_amount_cents: 500000 });
  if (error) throw error;

  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/$/);

  return user;
};
