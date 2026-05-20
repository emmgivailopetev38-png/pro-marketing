import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to login", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("login page renders magic link form", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("email@promarketing.bg")).toBeVisible();
  await expect(page.getByRole("button", { name: /Изпрати magic link/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Влез с Google/ })).toBeVisible();
});
