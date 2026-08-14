import { test, expect } from "@playwright/test";

test("a new member can request an account and lands on the pending screen", async ({ page }) => {
  const uniqueEmail = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.fill("#firstName", "Taylor");
  await page.fill("#lastName", "Test");
  await page.fill("#email", uniqueEmail);
  await page.fill("#password", "Password1");
  await page.getByRole("checkbox", { name: /i agree to the community guidelines/i }).click({ force: true });
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/register\/pending/);
  await expect(page.getByText(/Thanks for requesting an account/i)).toBeVisible();
});
