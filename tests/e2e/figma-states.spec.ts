import { test, expect, type Page } from "@playwright/test";
for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} Figma error, empty, running and detail states`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize(viewport);
    await page.goto("/app/import");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    async function capture(name: string) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page
            .locator("img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        name,
      ).toBe(true);
      await page.screenshot({
        path: `artifacts/screenshots/${viewport.name}-${name}.png`,
        fullPage: true,
      });
    }
    async function upload(page: Page, name: string, text: string) {
      await page.locator("input[type=file]").setInputFiles({
        name,
        mimeType: "text/csv",
        buffer: Buffer.from(text),
      });
    }
    await upload(
      page,
      "warnings.csv",
      "receipt_id,sku,quantity,price,timestamp\nr1,COF-001,1,4.50,2026-10-01\nr2,MISSING,1,5,2026-10-01",
    );
    await expect(page.getByText(/Warnings detected/i).first()).toBeVisible();
    await capture("import-warnings");
    await page.goto("/app/import");
    await upload(page, "rejected.csv", "wrong,columns\ninvalid,data");
    await expect(
      page.getByText("File rejected: action required"),
    ).toBeVisible();
    await capture("import-rejected");
    await page.getByLabel("Demo role").selectOption("system");
    await page.goto("/app/mining/setup");
    await page.getByText("Demo scenario controls").click();
    await page.getByLabel("Preview the no-data state").check();
    await capture("mining-no-data");
    await page.getByLabel("Preview the no-data state").uncheck();
    await page.getByLabel("Minimum profit target", { exact: true }).fill("-1");
    await page
      .getByRole("button", { name: "Discover Product Pairings" })
      .click();
    await expect(page.getByRole("alert")).toContainText("greater than");
    await capture("mining-invalid");
    await page
      .getByLabel("Minimum profit target", { exact: true })
      .fill("1200");
    await page
      .getByRole("button", { name: "Discover Product Pairings" })
      .click();
    await expect(
      page.getByRole("progressbar", { name: "Discovery progress" }),
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await capture("mining-running");
    await expect(
      page.getByRole("heading", { name: "Your Product Pairing Discoveries" }),
    ).toBeVisible({ timeout: 15000 });
    await capture("mining-results");
    await page.goto("/app/mining/setup");
    await page
      .getByLabel("Minimum profit target", { exact: true })
      .fill("100000");
    await page
      .getByRole("button", { name: "Discover Product Pairings" })
      .click();
    await expect(
      page.getByRole("heading", { name: "No product pairings found" }),
    ).toBeVisible({ timeout: 15000 });
    await capture("mining-empty");
    await page.getByLabel("Demo role").selectOption("merchandiser");
    await page.goto("/app/recommendations");
    await expect(
      page.getByRole("heading", {
        name: "No Product Groups Met Your Current Threshold",
      }),
    ).toBeVisible();
    await capture("recommendations-empty");
    await page.goto("/app/recommendations/r1");
    await expect(
      page.getByRole("heading", { name: "Physical Shelf Placement Blueprint" }),
    ).toBeVisible();
    await capture("recommendation-detail");
    expect(errors).toEqual([]);
  });
}
