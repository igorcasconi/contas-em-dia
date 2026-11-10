import { test as base, expect } from "@playwright/test";

import { type TestUser, createTestUser, removeUserByEmail } from "@/supabase/tests/helpers";

import { login } from "./helpers";

type Fixtures = {
  /** Usuário confirmado, sem onboarding. Removido ao fim do teste, mesmo em falha. */
  testUser: TestUser;
  /** Usuário com onboarding (Igor, R$ 5.000,00), já logado na Início. */
  onboardedUser: TestUser;
  /** Email para cadastro pela UI; o usuário criado é removido ao fim do teste. */
  signUpEmail: string;
};

export const test = base.extend<Fixtures>({
  // Overlay de dev do Next fica onde o dev deixou (.next/dev/cache) e pode cobrir a bottom nav.
  // Escondido, ele deixa de sinalizar erros: erro não tratado na página falha o teste.
  page: async ({ page }, provide) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.append(style);
      });
    });
    await provide(page);

    expect(pageErrors, "erros não tratados na página").toEqual([]);
  },

  testUser: async ({}, provide) => {
    const user = await createTestUser();
    await provide(user);
    await user.remove();
  },

  onboardedUser: async ({ page, testUser }, provide) => {
    const { error } = await testUser.client.rpc("complete_onboarding", { p_name: "Igor", p_amount_cents: 500000 });
    if (error) throw error;

    await login(page, testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/$/);
    await provide(testUser);
  },

   
  signUpEmail: async ({}, provide) => {
    const email = `e2e-${crypto.randomUUID()}@example.com`;
    await provide(email);
    await removeUserByEmail(email);
  },
});

export { expect };
