import { test, expect } from "@playwright/test";

// Visual layout checks for the two restored Figma compositions at intermediate widths.
for (const width of [320, 768, 1024]) {
  test(`Figma layout at ${width}px keeps content and actions inside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.setItem("paspm-role", "system");
    });
    for (const [name, route] of [
      ["mining", "/app/mining/setup"],
      ["detail", "/app/recommendations/r1"],
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        name,
      ).toBe(true);
      // Every visible action fits its own container, not only the document.
      const clipped = await page
        .locator("main .button")
        .evaluateAll((buttons) =>
          buttons
            .filter((button) => {
              const box = button.getBoundingClientRect();
              return (
                box.width > 0 &&
                (button.scrollWidth > button.clientWidth + 1 ||
                  box.right > innerWidth + 1)
              );
            })
            .map((button) => button.textContent?.trim()),
        );
      expect(clipped, name).toEqual([]);
      await page.screenshot({
        path: `artifacts/screenshots/${width}-${name}.png`,
        fullPage: true,
      });
    }
  });
}
