import { test, expect } from "@playwright/test";
import { signIn, DEV_PASSWORD } from "./helpers";

test.describe("Authentication", () => {
  test("a member can sign in with valid credentials", async ({ page }) => {
    await signIn(page, "member@livingword.church");
    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("an incorrect password is rejected", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", "member@livingword.church");
    await page.fill("#password", "WrongPassword1");
    await page.click('form button[type="submit"]');
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("a pending account is redirected to the approval-pending screen", async ({ page }) => {
    await signIn(page, "pending@livingword.church", DEV_PASSWORD);
    await expect(page).toHaveURL(/\/pending-approval/);
    await expect(page.getByText(/awaiting approval/i)).toBeVisible();
  });

  test("guests cannot reach a protected route without signing in", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
