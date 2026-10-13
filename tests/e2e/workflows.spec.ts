import { test, expect, type Page } from "@playwright/test";
async function role(page: Page, value: string) {
  await page.getByLabel("Demo role").selectOption(value);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app/import");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  (page as Page & { demoErrors: string[] }).demoErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { demoErrors: string[] }).demoErrors).toEqual([]);
});
test("system configures mining and opens the completed benchmark", async ({
  page,
}) => {
  await role(page, "system");
  await page.goto("/app/mining/setup");
  await page
    .getByText("Algorithm & advanced settings", { exact: true })
    .click();
  await page.getByLabel("Algorithm", { exact: true }).selectOption("EFIM");
  await page.getByLabel("Minimum utility", { exact: true }).fill("120");
  await page.getByLabel("Minimum profit target", { exact: true }).fill("1200");
  await page.getByRole("button", { name: "Discover Product Pairings" }).click();
  await expect(page.getByRole("link", { name: "View benchmark" })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("link", { name: "View benchmark" }).click();
  await expect(page.getByText(/Simulated/i).first()).toBeVisible();
  await expect(page.getByText(/EFIM/).first()).toBeVisible();
});
test("store creates, edits and archives a product, imports CSV and activates a campaign", async ({
  page,
}) => {
  await page.goto("/app/products");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("E2E oat crackers");
  await page.getByLabel("SKU", { exact: true }).fill("E2E-001");
  await page.getByLabel("Price ($)", { exact: true }).fill("5");
  await page.getByLabel("Cost ($)", { exact: true }).fill("2");
  await page.getByLabel("Stock", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByLabel("Search products").fill("E2E-001");
  const row = page.getByRole("row").filter({ hasText: "E2E-001" });
  await expect(row).toContainText("E2E oat crackers");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("E2E toasted oat crackers");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(row).toContainText("E2E toasted oat crackers");
  await row.getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("button", { name: "Archive product", exact: true })
    .click();
  await expect(
    page.getByText("No products found", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/import");
  await page.locator("input[type=file]").setInputFiles({
    name: "e2e.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "receipt_id,sku,quantity,price,timestamp\nE2E-R001,COF-001,2,4.50,2026-10-01",
    ),
  });
  await expect(
    page.getByText("All transaction rows passed validation", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to Column Mapping" })
    .click();
  await page
    .getByRole("button", { name: "Confirm mapping", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Continue to Product Pairing" }),
  ).toBeVisible();
  await page.goto("/app/transactions");
  await page.getByLabel("Search transactions").fill("E2E-R001");
  await expect(
    page.getByRole("row").filter({ hasText: "E2E-R001" }),
  ).toContainText("$9.00");
  await page.goto("/app/campaigns");
  await page.getByRole("button", { name: "Activate campaign" }).click();
  await expect(page.getByText("active", { exact: true })).toBeVisible();
});
test("merchandiser approves a pairing, creates a display and runs an A/B simulation", async ({
  page,
}) => {
  await role(page, "merchandiser");
  await page.goto("/app/recommendations/r2");
  await page
    .getByRole("button", { name: "Approve & Push to Planogram" })
    .click();
  await page
    .getByRole("button", { name: "Confirm approval", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Place approved pairing", exact: true }),
  ).toBeVisible();
  await page.goto("/app/layouts/new");
  await page.getByLabel("Layout name").fill("E2E pantry display");
  await page.getByRole("button", { name: /Mediterranean essentials/ }).click();
  await page
    .getByRole("button", {
      name: "Place selected pairing in position 1",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Layout saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save & approve layout" }).click();
  await expect(
    page.getByText("Layout approved. Ready for a campaign.", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/experiments");
  await page
    .getByLabel("Approved display")
    .selectOption({ label: "E2E pantry display" });
  await page.getByLabel("Experiment name").fill("E2E display comparison");
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E display comparison" }),
  ).toBeVisible();
  await expect(page.getByText("16.8%", { exact: true })).toBeVisible();
});
test("customer sees activated pairings, adds a bundle and updates the basket", async ({
  page,
}) => {
  await page.goto("/app/campaigns");
  await page.getByRole("button", { name: "Activate campaign" }).click();
  await expect(page.getByText("active", { exact: true })).toBeVisible();
  await role(page, "customer");
  await page.goto("/shop/products/p1");
  await expect(
    page.getByRole("heading", {
      name: "Artisan Dark Roast Coffee",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Good alongside your selection" }),
  ).toBeVisible();
  await page.goto("/shop/bundles");
  await expect(
    page.getByRole("heading", { name: "Coffee & biscotti" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add complete pairing" }).click();
  await page.getByRole("link", { name: "View basket" }).click();
  await expect(
    page.getByRole("heading", { name: "2 items, thoughtfully chosen." }),
  ).toBeVisible();
  await page.getByLabel("Quantity", { exact: true }).first().fill("2");
  await expect(
    page.getByRole("heading", { name: "3 items, thoughtfully chosen." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "1 items, thoughtfully chosen." }),
  ).toBeVisible();
});
test("invalid CSV is rejected and invalid mining thresholds block execution", async ({
  page,
}) => {
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("wrong,columns\nnot,transactions"),
  });
  await expect(
    page.getByText("File rejected: action required", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to Column Mapping" }),
  ).toBeDisabled();
  await page.goto("/app/transactions");
  await page.getByLabel("Search transactions").fill("not,transactions");
  await expect(
    page.getByText("No matching transactions", { exact: true }),
  ).toBeVisible();
  await role(page, "system");
  await page.goto("/app/mining/setup");
  await page
    .getByText("Algorithm & advanced settings", { exact: true })
    .click();
  await page.getByLabel("Minimum utility", { exact: true }).fill("-1");
  await page.getByRole("button", { name: "Discover Product Pairings" }).click();
  await expect(page).toHaveURL(/\/app\/mining\/setup/);
  await expect(
    page.getByRole("button", { name: "Discover Product Pairings" }),
  ).toBeVisible();
});

test("connection status persists across screens and reset restores the seed", async ({
  page,
}) => {
  await page.goto("/app/integrations");
  await page.getByRole("button", { name: "Configure", exact: true }).click();
  await page.getByLabel("Example endpoint").fill("https://pos.example.test");
  await page.getByLabel("Connection state").selectOption("disconnected");
  await page.getByRole("button", { name: "Save connection" }).click();
  await expect(
    page.getByText("Demo POS Disconnected", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Products", exact: true }).click();
  await expect(
    page.getByText("Demo POS Disconnected", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Demo POS Disconnected", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset Demo Data", exact: true })
    .click();
  await page.getByRole("button", { name: "Reset all demo data" }).click();
  await expect(
    page.getByText("Demo POS Connected", { exact: true }),
  ).toBeVisible();
});
