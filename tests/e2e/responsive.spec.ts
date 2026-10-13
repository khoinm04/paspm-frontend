import { test, expect } from "@playwright/test";
for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} catalog and storefront stay within viewport`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.goto("/app/products");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Products", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/screenshots/${viewport.name}-catalog.png`,
      fullPage: true,
    });
    await page.getByLabel("Search products").fill("no-such-product-xyz");
    await expect(
      page.getByText("No products found", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Demo role").selectOption("customer");
    await page.goto("/shop");
    await expect(
      page.getByRole("heading", { name: "Good things belong together." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/screenshots/${viewport.name}-storefront.png`,
      fullPage: true,
    });
    await page.getByLabel("Search products").fill("no-such-product-xyz");
    await expect(
      page.getByText("No products found", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} import, mining, recommendations and login fit the viewport`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.goto("/app/import");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const capture = async (name: string) => {
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${name} must have no document horizontal overflow`,
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/screenshots/${viewport.name}-${name}.png`,
        fullPage: true,
      });
    };
    await expect(
      page.getByRole("heading", {
        name: "Import POS Transaction Data",
        exact: true,
      }),
    ).toBeVisible();
    await capture("import");
    await page.getByLabel("Demo role").selectOption("system");
    await page.goto("/app/mining/setup");
    await expect(
      page.getByRole("heading", {
        name: "Product Pairing Setup",
        exact: true,
      }),
    ).toBeVisible();
    await capture("mining");
    await page.getByLabel("Demo role").selectOption("merchandiser");
    await page.goto("/app/recommendations");
    await expect(
      page.getByRole("heading", {
        name: "Ranked Product Recommendations",
        exact: true,
      }),
    ).toBeVisible();
    await capture("recommendations");
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await capture("login");
    expect(errors).toEqual([]);
  });
}
