import { expect, test } from "./fixtures";

const PAGES = ["/", "/recorrencias", "/avulsos", "/configuracoes"];

test("páginas logadas cabem na largura do celular, com barra de topo", async ({ page, onboardedUser: _user }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "layout mobile");

  for (const width of [360, 412]) {
    await page.setViewportSize({ width, height: 800 });

    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "Menu inferior" })).toBeVisible();

      // Em emulação mobile o layout viewport cresce junto com o conteúdo: comparar com a largura do aparelho
      const layoutWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(layoutWidth, `${path} em ${width}px`).toBeLessThanOrEqual(width);
    }
  }

  const topBar = page.getByRole("banner");
  await expect(topBar).toHaveCSS("height", "32px");
  await page.goto("/configuracoes");
  await topBar.getByRole("link", { name: "Contas em Dia" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Em 360px: rótulos inteiros (sem truncar), ícone acima do texto
  await page.setViewportSize({ width: 360, height: 800 });
  const nav = page.getByRole("navigation", { name: "Menu inferior" });
  for (const label of ["Início", "Recorrências", "Avulsos", "Configurações"]) {
    const link = nav.getByRole("link", { name: label });
    const text = link.getByText(label, { exact: true });
    expect(await text.evaluate((element) => element.scrollWidth <= element.clientWidth), label).toBe(true);

    const [icon, textBox] = await Promise.all([link.locator("svg").boundingBox(), text.boundingBox()]);
    expect(icon!.y + icon!.height, label).toBeLessThanOrEqual(textBox!.y);
  }
});

test("nome longo no título não estoura a largura", async ({ page, onboardedUser: user }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "layout mobile");

  const { error } = await user.client.from("profiles").update({ name: "N".repeat(100) }).eq("id", user.userId);
  expect(error).toBeNull();

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("N".repeat(100));

  const layoutWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(layoutWidth).toBeLessThanOrEqual(360);
});

test("barra de topo não aparece no desktop", async ({ page, onboardedUser: _user }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "layout desktop");

  await expect(page.getByRole("heading", { name: "Olá, Igor" })).toBeVisible();
  await expect(page.getByRole("banner")).toBeHidden();
});
