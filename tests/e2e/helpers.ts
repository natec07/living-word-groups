import type { Page } from "@playwright/test";

export const DEV_PASSWORD = "LivingWord2026!";

export async function signIn(page: Page, email: string, password: string = DEV_PASSWORD) {
  await page.goto("/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('form button[type="submit"]');
  await page.waitForURL(/\/(home|pending-approval)/);
}
