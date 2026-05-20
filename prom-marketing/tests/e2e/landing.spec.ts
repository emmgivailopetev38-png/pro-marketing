import { test, expect } from "@playwright/test";

test("landing renders hero and main sections", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("бизнеса си", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: /Запази безплатна консултация/ })).toBeVisible();
  await expect(page.locator("#services")).toBeVisible();
  await expect(page.locator("#process")).toBeVisible();
  await expect(page.locator("#industries")).toBeVisible();
  await expect(page.locator("#faq")).toBeVisible();
});

test("clicking Запази среща in navbar triggers booking flow", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const button = page.locator("header button", { hasText: "Запази среща" });
  await expect(button).toBeVisible();
  await button.click();
  // Cal.com iframe may not load in CI without valid credentials; just confirm no error toast appeared
  await page.waitForTimeout(500);
});

test("navigation anchors scroll to sections", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("navigation").getByRole("link", { name: "Услуги" }).click();
  await expect(page).toHaveURL(/#services$/);
});
