import { expect, test } from "./fixtures";
import { login } from "./helpers";

test("navega entre as seções pelo menu do dispositivo", async ({ page, onboardedUser: _user }, testInfo) => {
  await expect(page.getByRole("heading", { name: "Olá, Igor" })).toBeVisible();

  const isMobile = testInfo.project.name === "mobile";
  const visibleNav = page.getByRole("navigation", { name: isMobile ? "Menu inferior" : "Menu lateral" });
  const hiddenNav = page.getByRole("navigation", { name: isMobile ? "Menu lateral" : "Menu inferior" });
  await expect(hiddenNav).toBeHidden();

  await expect(visibleNav.getByRole("link", { name: "Recorrências" })).toHaveAttribute("href", "/recorrencias");

  await visibleNav.getByRole("link", { name: "Configurações" }).click();
  await expect(page).toHaveURL(/\/configuracoes$/);
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(visibleNav.getByRole("link", { name: "Configurações" })).toHaveAttribute("aria-current", "page");

  await visibleNav.getByRole("link", { name: "Início" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("login sem onboarding leva ao onboarding, sem menu", async ({ page, testUser: user }) => {
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("navigation")).toHaveCount(0);
});
